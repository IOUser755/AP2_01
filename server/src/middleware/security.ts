import { randomUUID } from 'node:crypto';

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

import { AppError } from '../utils/AppError.js';
import { CustomError } from '../utils/errors.js';
import { auditLogger } from '../utils/logger.js';

type Sanitizable = Record<string, unknown> | Array<unknown> | null | undefined;

const sanitizeObject = (value: Sanitizable): void => {
  if (!value || typeof value !== 'object') {
    return;
  }

  const obj = value as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor') {
      delete obj[key];
      continue;
    }

    const nested = obj[key];
    if (typeof nested === 'object' && nested !== null) {
      sanitizeObject(nested as Sanitizable);
    }
  }
};

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss:', 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
});

export const requestSecurity = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();

  res.setHeader('X-Request-Id', requestId);
  (req as any).requestId = requestId;
  (req.headers as Record<string, string | string[] | undefined>)['x-request-id'] = requestId;

  sanitizeObject(req.body);
  sanitizeObject(req.query as unknown as Sanitizable);
  sanitizeObject(req.params as unknown as Sanitizable);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'payment=(), microphone=(), camera=()');

  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  next();
};

export const createRateLimiter = (config: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) =>
  rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: config.keyGenerator || ((req) => `${req.ip}:${(req as any).user?.tenantId ?? 'anonymous'}`),
    handler: (req, res) => {
      auditLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tenantId: (req as any).user?.tenantId,
        endpoint: req.path,
      });

      res.status(429).json({
        error: config.message,
        retryAfter: Math.round(config.windowMs / 1000),
      });
    },
    message: { error: config.message },
  });

export const paymentRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many payment requests. Please try again later.',
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests. Please try again later.',
});

export const requestSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: 500,
  maxDelayMs: 20000,
});

export const validatePaymentRequest = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'BTC', 'ETH'])
    .withMessage('Invalid currency'),
  body('paymentMethodId')
    .isLength({ min: 1 })
    .withMessage('Payment method ID is required')
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description too long')
    .escape(),
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      auditLogger.warn('Payment validation failed', {
        errors: errors.array(),
        tenantId: (req as any).user?.tenantId,
        userId: (req as any).user?.id,
      });

      return next(new AppError('Invalid payment data', { statusCode: 400, code: 'INVALID_PAYMENT_DATA' }));
    }

    next();
  },
];

export const validateMandateSignature = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mandateData, signature } = req.body ?? {};

    if (!mandateData || !signature) {
      throw new AppError('Mandate data and signature required', {
        statusCode: 400,
        code: 'MANDATE_SIGNATURE_REQUIRED',
      });
    }

    const { verifyMandateSignature } = await import('../utils/crypto.js');
    const isValid = await verifyMandateSignature(mandateData, signature);

    if (!isValid) {
      auditLogger.error('Invalid mandate signature', {
        tenantId: (req as any).user?.tenantId,
        userId: (req as any).user?.id,
        mandateId: mandateData?.id,
      });

      throw new AppError('Invalid mandate signature', {
        statusCode: 403,
        code: 'MANDATE_SIGNATURE_INVALID',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    throw new CustomError('API key is required', 401, 'API_KEY_MISSING');
  }

  const validApiKey = process.env.API_KEY;
  if (!validApiKey || apiKey !== validApiKey) {
    throw new CustomError('Invalid API key', 401, 'API_KEY_INVALID');
  }

  next();
};

export const ipWhitelist = (allowedIPs: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip;

    if (!allowedIPs.includes(clientIP)) {
      throw new CustomError('Access denied: IP not whitelisted', 403, 'IP_NOT_ALLOWED');
    }

    next();
  };

export const validateUserAgent = (req: Request, _res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');

  if (!userAgent || userAgent.trim() === '' || userAgent.toLowerCase().includes('bot')) {
    throw new CustomError('Invalid user agent', 400, 'INVALID_USER_AGENT');
  }

  next();
};

export const requestSizeLimit = (maxSize: string = '10mb') => {
  const maxBytes = parseSize(maxSize);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = Number.parseInt(req.get('Content-Length') || '0', 10);

    if (contentLength > maxBytes) {
      throw new CustomError(
        `Request too large. Maximum size: ${maxSize}`,
        413,
        'REQUEST_TOO_LARGE',
      );
    }

    next();
  };
};

const parseSize = (size: string): number => {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new CustomError('Invalid size format', 400, 'INVALID_SIZE_FORMAT');
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2] ?? 'b';

  return value * units[unit];
};
