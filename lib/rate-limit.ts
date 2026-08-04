import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      '[Rate Limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set; rate limiting disabled.'
    );
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedisClient();

/**
 * Rate limiter for sign-in endpoints.
 * Sliding window: 5 requests per 60 seconds per IP.
 * Returns null if Redis is not configured.
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: false,
      prefix: 'ratelimit:login',
    })
  : null;

/**
 * Rate limiter for sign-up endpoints.
 * Sliding window: 3 requests per 1 hour per IP.
 * Returns null if Redis is not configured.
 */
export const signupRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: false,
      prefix: 'ratelimit:signup',
    })
  : null;
