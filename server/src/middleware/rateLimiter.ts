import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { CustomError } from '../utils/index.js';
import { config, logger } from '../config/index.js';

const redisClient = new Redis(config.redisUrl, {
  enableOfflineQueue: false,
});

redisClient.on('error', error => {
  logger.error('Redis connection error for rate limiter', { error: error.message });
});

const limiterConfigs = {
  api: {
    keyPrefix: 'rate_limit_api',
    points: 1000,
    duration: 3600,
    blockDuration: 3600,
  },
  auth: {
    keyPrefix: 'rate_limit_auth',
    points: 10,
    duration: 900,
    blockDuration: 900,
  },
  execution: {
    keyPrefix: 'rate_limit_execution',
    points: 100,
    duration: 3600,
    blockDuration: 300,
  },
  expensive: {
    keyPrefix: 'rate_limit_expensive',
    points: 5,
    duration: 3600,
    blockDuration: 3600,
  },
} as const;

const rateLimiters: Record<keyof typeof limiterConfigs, RateLimiterRedis> = Object.entries(
  limiterConfigs
).reduce((acc, [key, options]) => {
  acc[key as keyof typeof limiterConfigs] = new RateLimiterRedis({
    storeClient: redisClient,
    ...options,
  });
  return acc;
}, {} as Record<keyof typeof limiterConfigs, RateLimiterRedis>);

const formatReset = (msBeforeNext: number): string => {
  return new Date(Date.now() + msBeforeNext).toISOString();
};

const createRateLimiter = (type: keyof typeof limiterConfigs) => {
  const limiter = rateLimiters[type];
  const config = limiterConfigs[type];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.user ? `${req.ip}:${req.user._id}` : req.ip;

    try {
      const result = await limiter.consume(key);

      res.set({
        'X-RateLimit-Limit': config.points.toString(),
        'X-RateLimit-Remaining': Math.max(result.remainingPoints, 0).toString(),
        'X-RateLimit-Reset': formatReset(result.msBeforeNext),
      });

      next();
    } catch (error: any) {
      if (error instanceof Error && !('msBeforeNext' in error)) {
        logger.error('Unexpected rate limiter error', {
          message: error.message,
          type,
          key,
        });
        next(error);
        return;
      }

      const retrySeconds = Math.max(1, Math.round(error.msBeforeNext / 1000));

      logger.warn('Rate limit exceeded', {
        type,
        key,
        path: req.originalUrl,
        method: req.method,
        retryAfter: retrySeconds,
      });

      res.set({
        'Retry-After': retrySeconds.toString(),
        'X-RateLimit-Limit': config.points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': formatReset(error.msBeforeNext),
      });

      next(
        new CustomError(
          'Too many requests. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }
  };
};

export const apiRateLimit = createRateLimiter('api');
export const authRateLimit = createRateLimiter('auth');
export const executionRateLimit = createRateLimiter('execution');
export const expensiveRateLimit = createRateLimiter('expensive');

export default {
  api: apiRateLimit,
  auth: authRateLimit,
  execution: executionRateLimit,
  expensive: expensiveRateLimit,
};
