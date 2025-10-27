import { Request, Response, NextFunction } from 'express';
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

export default security;

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
