import type { Context, Next } from 'hono';
import { redis } from '../cache/redis.js';

interface SlidingWindowOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (c: Context) => string;
}

export function slidingWindowRateLimiter(opts: SlidingWindowOptions) {
  const { windowMs, limit, keyGenerator } = opts;
  const windowSec = windowMs / 1000;

  return async (c: Context, next: Next) => {
    const ip = keyGenerator
      ? keyGenerator(c)
      : (c.req.header('x-forwarded-for') ??
        c.req.header('x-real-ip') ??
        'unknown');

    const key = `ratelimit:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const multi = redis.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zCard(key);
    multi.zAdd(key, { score: now, value: String(now) });
    multi.expire(key, Math.ceil(windowSec));

    const results = await multi.exec();
    const count = results[1] as unknown as number;

    if (count >= limit) {
      const retryAfter = Math.ceil(windowSec);
      c.header('Retry-After', String(retryAfter));
      c.header('X-RateLimit-Limit', String(limit));
      c.header('X-RateLimit-Remaining', '0');
      return c.json({ error: 'Rate limit exceeded', retryAfter }, 429);
    }

    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(limit - count - 1));
    await next();
  };
}
