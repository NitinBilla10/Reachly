import Redis from 'ioredis';

// Allow fallback to no-op cache if REDIS_URL is not provided or fails to connect
let redis: Redis | null = null;

export const initCache = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      retryStrategy(times) {
        if (times > 3) {
          console.warn('Redis connection failed, falling back to no-op cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    redis.on('error', (err) => {
      console.warn('Redis error:', err.message);
    });

  } catch (error) {
    console.warn('Could not initialize Redis client.');
  }
};

export const getCache = async (key: string): Promise<any | null> => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis SET error:', error);
  }
};

export const invalidateCache = async (key: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
};

export const invalidatePattern = async (pattern: string): Promise<void> => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis DEL pattern error:', error);
  }
};
