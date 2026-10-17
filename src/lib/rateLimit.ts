import redis from './redis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetMs: windowStart + windowMs,
    };
  } catch {
    // If Redis is unavailable, allow the request (fail open)
    return { allowed: true, remaining: limit, resetMs: now + windowMs };
  }
}

export async function isIPBlocked(ipHash: string): Promise<boolean> {
  try {
    const key = `blocked:ip:${ipHash}`;
    const val = await redis.get(key);
    return val !== null;
  } catch {
    return false;
  }
}

export async function blockIPInRedis(
  ipHash: string,
  durationMs: number
): Promise<void> {
  const key = `blocked:ip:${ipHash}`;
  await redis.set(key, '1', 'PX', durationMs);
}

export async function unblockIPInRedis(ipHash: string): Promise<void> {
  const key = `blocked:ip:${ipHash}`;
  await redis.del(key);
}
