import { createClient } from 'redis';
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL;
console.log(redisUrl);
if (!redisUrl) {
  console.warn('Redis database URL is not available in .env');
}

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => console.error('Redis Client Error', err));
