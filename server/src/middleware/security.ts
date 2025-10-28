import { Request, Response, NextFunction } from 'express';

import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { CustomError } from '../utils/index.js';


import { randomUUID } from 'node:crypto';



const sanitizeObject = (value: unknown): void => {
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
      sanitizeObject(nested);
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
      connectSrc: ["'self'", 'wss:', 'ws:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

export const requestSecurity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {


const security = (req: Request, res: Response, next: NextFunction): void => {


  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  req.requestId = requestId;
  (req.headers as Record<string, string | string[] | undefined>)['x-request-id'] = requestId;

  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'payment=(), microphone=(), camera=()');

  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  next();
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

export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip;

    if (!allowedIPs.includes(clientIP)) {
      throw new CustomError('Access denied: IP not whitelisted', 403, 'IP_NOT_ALLOWED');
    }

    next();
  };
};

export const validateUserAgent = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get('User-Agent');

  if (!userAgent || userAgent.trim() === '' || userAgent.toLowerCase().includes('bot')) {
    throw new CustomError('Invalid user agent', 400, 'INVALID_USER_AGENT');
  }

  next();
};

export const requestSizeLimit = (maxSize: string = '10mb') => {
  const maxBytes = parseSize(maxSize);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);

    if (contentLength > maxBytes) {
      throw new CustomError(
        `Request too large. Maximum size: ${maxSize}`,
        413,
        'REQUEST_TOO_LARGE'
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

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * units[unit];
};

export default {
  securityHeaders,
  requestSecurity,
  validateApiKey,
  ipWhitelist,
  validateUserAgent,
  requestSizeLimit,
};


declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
