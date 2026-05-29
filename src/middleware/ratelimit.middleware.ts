import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { RATE_LIMITS } from '../types/constants';
import redis from '../config/redis.config';

/**
 * Store for rate limiting using Redis
 */
class RedisStore {
  private prefix: string;

  constructor(prefix: string = 'rl:') {
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    const redisKey = `${this.prefix}${key}`;
    
    const multi = redis.multi();
    multi.incr(redisKey);
    multi.pttl(redisKey);
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis transaction failed');
    }
    
    const totalHits = results[0][1] as number;
    const ttl = results[1][1] as number;
    
    let resetTime: Date | undefined;
    if (ttl === -1) {
      await redis.pexpire(redisKey, RATE_LIMITS.GLOBAL.WINDOW_MS);
      resetTime = new Date(Date.now() + RATE_LIMITS.GLOBAL.WINDOW_MS);
    } else if (ttl > 0) {
      resetTime = new Date(Date.now() + ttl);
    }
    
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    await redis.decr(`${this.prefix}${key}`);
  }

  async resetKey(key: string): Promise<void> {
    await redis.del(`${this.prefix}${key}`);
  }
}

/**
 * Custom key generator that includes user ID if authenticated
 */
function keyGenerator(req: Request): string {
  const userId = (req as any).user?.sub;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
}

/**
 * Custom handler for when rate limit is exceeded
 */
function rateLimitHandler(req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
    requestId: req.requestId,
  });
}

/**
 * Global rate limiter - applies to all requests
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.WINDOW_MS,
  max: RATE_LIMITS.GLOBAL.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, 
  legacyHeaders: false, 
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Authentication rate limiter - stricter limits for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
  handler: rateLimitHandler,
});

/**
 * Transaction rate limiter - for financial operations
 */
export const transactionRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.TRANSACTION.WINDOW_MS,
  max: RATE_LIMITS.TRANSACTION.MAX_REQUESTS,
  message: 'Too many transaction requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * API rate limiter - general API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.WINDOW_MS,
  max: RATE_LIMITS.API.MAX_REQUESTS,
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Create a custom rate limiter with specific options
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
  });
}
