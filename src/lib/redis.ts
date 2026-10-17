import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedis(): Redis {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
  });

  return redis;
}

export const redis = globalForRedis.redis || createRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
