import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redis from '../config/redis.js';
import config from '../config/keys.js';
import { CustomError } from './errorHandler.js';
import { logger } from '../config/logger.js';

// Rate limiter instances
let generalLimiter: RateLimiterRedis | RateLimiterMemory;
let authLimiter: RateLimiterRedis | RateLimiterMemory;
let apiLimiter: RateLimiterRedis | RateLimiterMemory;
let webhookLimiter: RateLimiterRedis | RateLimiterMemory;

/**
 * Initialize rate limiters
 */
function initializeRateLimiters(): void {
  const redisClient = redis.getClient();
  
  // General rate limiter (per IP)
  const generalOptions = {
    points: config.rateLimitMaxRequests, // Number of requests
    duration: Math.floor(config.rateLimitWindowMs / 1000), // Per time period in seconds
    blockDuration: 60, // Block for 60 seconds if limit exceeded
  };

  // Authentication rate limiter (stricter)
  const authOptions = {
    points: 5, // 5 attempts
    duration: 900, // per 15 minutes
    blockDuration: 900, // Block for 15 minutes
  };

  // API rate limiter (per authenticated user)
  const apiOptions = {
    points: 1000, // 1000 requests
    duration: 3600, // per hour
    blockDuration: 60, // Block for 60 seconds
  };

  // Webhook rate limiter
  const webhookOptions = {
    points: 100, // 100 requests
    duration: 60, // per minute
    blockDuration: 300, // Block for 5 minutes
  };

  if (redisClient) {
    // Use Redis-based rate limiters for distributed systems
    generalLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_general',
      ...generalOptions,
    });

    authLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_auth',
      ...authOptions,
    });

    apiLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_api',
      ...apiOptions,
    });

    webhookLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_webhook',
      ...webhookOptions,
    });

    logger.info('Rate limiters initialized with Redis backend');
  } else {
    // Fallback to memory-based rate limiters
    generalLimiter = new RateLimiterMemory(generalOptions);
    authLimiter = new RateLimiterMemory(authOptions);
    apiLimiter = new RateLimiterMemory(apiOptions);
    webhookLimiter = new RateLimiterMemory(webhookOptions);

    logger.warn('Rate limiters initialized with memory backend (not suitable for production)');
  }
}

// Initialize rate limiters
initializeRateLimiters();

/**
 * Get client identifier for rate limiting
 */
function getClientKey(req: Request, prefix: string = ''): string {
  // For authenticated requests, use user + tenant combination
  if (req.user) {
    return `${prefix}${req.user._id}_${req.user.tenantId}`;
  }
  
  // For unauthenticated requests, use IP address
  return `${prefix}${req.ip}`;
}

/**
 * Handle rate limit exceeded
 */
function handleRateLimitExceeded(
  req: Request,
  res: Response,
  rateLimiterRes: any,
  limiterType: string
): void {
  const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000);
  
  // Log rate limit exceeded
  logger.security('Rate limit exceeded', {
    limiterType,
    clientKey: getClientKey(req),
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    retryAfter,
  });

  // Set rate limit headers
  res.set({
    'Retry-After': String(retryAfter),
    'X-RateLimit-Limit': String(rateLimiterRes.totalHits),
    'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints || 0),
    'X-RateLimit-Reset': String(new Date(Date.now() + rateLimiterRes.msBeforeNext)),
  });

  const error = new CustomError(
    `Too many requests. Try again in ${retryAfter} seconds.`,
    429,
    'RATE_LIMIT_EXCEEDED'
  );

  res.status(429).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      retryAfter,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Set rate limit headers for successful requests
 */
function setRateLimitHeaders(res: Response, rateLimiterRes: any): void {
  res.set({
    'X-RateLimit-Limit': String(rateLimiterRes.totalHits),
    'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints || 0),
    'X-RateLimit-Reset': String(new Date(Date.now() + rateLimiterRes.msBeforeNext)),
  });
}

/**
 * General rate limiter middleware
 */
const generalRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = getClientKey(req, 'general_');
    const rateLimiterRes = await generalLimiter.consume(key);
    
    setRateLimitHeaders(res, rateLimiterRes);
    next();
  } catch (rateLimiterRes) {
    handleRateLimitExceeded(req, res, rateLimiterRes, 'general');
  }
};

/**
 * Authentication rate limiter middleware
 */
const authRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use IP + email combination for auth attempts
    const email = req.body.email || 'unknown';
    const key = `auth_${req.ip}_${email}`;
    
    const rateLimiterRes = await authLimiter.consume(key);
    
    setRateLimitHeaders(res, rateLimiterRes);
    next();
  } catch (rateLimiterRes) {
    handleRateLimitExceeded(req, res, rateLimiterRes, 'auth');
  }
};

/**
 * API rate limiter middleware for authenticated routes
 */
const apiRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = getClientKey(req, 'api_');
    const rateLimiterRes = await apiLimiter.consume(key);
    
    setRateLimitHeaders(res, rateLimiterRes);
    next();
  } catch (rateLimiterRes) {
    handleRateLimitExceeded(req, res, rateLimiterRes, 'api');
  }
};

/**
 * Webhook rate limiter middleware
 */
const webhookRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = `webhook_${req.ip}`;
    const rateLimiterRes = await webhookLimiter.consume(key);
    
    setRateLimitHeaders(res, rateLimiterRes);
    next();
  } catch (rateLimiterRes) {
    handleRateLimitExceeded(req, res, rateLimiterRes, 'webhook');
  }
};

/**
 * Progressive rate limiter based on user plan
 */
const planBasedRateLimit = (planLimits: Record<string, number>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.tenant) {
      return next();
    }

    try {
      const plan = req.tenant.subscription?.plan || 'free';
      const limit = planLimits[plan] || planLimits.free || 100;

      const rateLimiter = new (redis.getClient() ? RateLimiterRedis : RateLimiterMemory)({
        storeClient: redis.getClient(),
        keyPrefix: `rl_plan_${plan}`,
        points: limit,
        duration: 3600, // per hour
        blockDuration: 60,
      });

      const key = getClientKey(req, 'plan_');
      const rateLimiterRes = await rateLimiter.consume(key);
      
      setRateLimitHeaders(res, rateLimiterRes);
      next();
    } catch (rateLimiterRes) {
      handleRateLimitExceeded(req, res, rateLimiterRes, 'plan');
    }
  };
};

/**
 * Burst protection for expensive operations
 */
const burstProtection = (points: number = 5, duration: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rateLimiter = new (redis.getClient() ? RateLimiterRedis : RateLimiterMemory)({
        storeClient: redis.getClient(),
        keyPrefix: 'rl_burst',
        points,
        duration,
        blockDuration: duration * 2,
      });

      const key = getClientKey(req, 'burst_');
      const rateLimiterRes = await rateLimiter.consume(key);
      
      setRateLimitHeaders(res, rateLimiterRes);
      next();
    } catch (rateLimiterRes) {
      handleRateLimitExceeded(req, res, rateLimiterRes, 'burst');
    }
  };
};

export {
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  webhookRateLimit,
  planBasedRateLimit,
  burstProtection,
};

export default generalRateLimit;
