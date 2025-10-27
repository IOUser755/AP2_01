import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import config from '../config/keys.js';
import redis from '../config/redis.js';
import { logger } from '../config/logger.js';

const createStore = (): RedisStore | undefined => {
  if (!config.enableCaching) {
    return undefined;
  }

  const client = redis.getClient();
  if (!client) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: async (...args: string[]) => client.sendCommand(args as any),
    prefix: 'rl:',
  });
};

let limiter: ReturnType<typeof rateLimit> | null = null;

const getLimiter = () => {
  if (!limiter) {
    limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many requests, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      },
      skip: (req: Request) => req.path.startsWith('/health') || req.path.startsWith('/api/status'),
      keyGenerator: (req: Request) => req.ip || req.headers['x-forwarded-for']?.toString() || req.hostname,
      handler: (req: Request, res: Response) => {
        logger.security('Rate limit exceeded', {
          ipAddress: req.ip,
          path: req.originalUrl,
          method: req.method,
        });

        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        });
      },
      store: createStore(),
    });
  }

  return limiter!;
};

const rateLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const middleware = getLimiter();
  middleware(req, res, next);
};

export default rateLimiter;
