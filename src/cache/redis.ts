import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('Redis database URL is not available in .env');
}

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => console.error('Redis Client Error', err));
