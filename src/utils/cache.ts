import { redis } from '../cache/redis.js';

/**
 * Serializes a value to JSON and stores it in Redis with a TTL.
 * @param key - Cache key.
 * @param value - Value to cache.
 * @param ttlSeconds - Time-to-live in seconds. Defaults to 600.
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number = 600) {
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

/**
 * Retrieves and deserializes a cached value.
 * @param key - Cache key.
 * @returns The cached value, or `null` on a miss or after expiry.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (value === null) return null;
  return JSON.parse(value) as T;
}

/**
 * Removes a single key from the cache.
 * @param key - Cache key to delete.
 */
export async function invalidate(key: string) {
  await redis.del(key);
}

/**
 * Removes all keys matching a glob pattern using Redis SCAN.
 * Use for invalidating a family of keys (e.g. `events:batch:{id}:*`) when
 * the exact keys are not known ahead of time.
 * @param pattern - Glob pattern passed to SCAN MATCH (e.g. `events:batch:abc:*`).
 */
export async function invalidatePattern(pattern: string) {
  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    await redis.del(key);
  }
}
