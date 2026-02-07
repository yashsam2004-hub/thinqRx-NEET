import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Redis not configured - rate limiting and caching disabled");
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

/**
 * Redis key patterns for multi-course platform
 */
export const RedisKeys = {
  // AI rate limiting: ai:{userId}:{courseId}
  aiLimit: (userId: string, courseId: string) => `ai:${userId}:${courseId}`,
  
  // Practice test rate limiting: test:{userId}:{courseId}
  testLimit: (userId: string, courseId: string) => `test:${userId}:${courseId}`,
  
  // Mock test attempts: mock:{userId}:{courseId}:{testId}
  mockAttempt: (userId: string, courseId: string, testId: string) => 
    `mock:${userId}:${courseId}:${testId}`,
  
  // Coupon usage: coupon:{code}
  couponUsage: (code: string) => `coupon:${code}`,
  
  // Coupon lock (prevent race conditions): coupon:lock:{code}
  couponLock: (code: string) => `coupon:lock:${code}`,
  
  // Cache syllabus outline: outline:{courseId}:{subjectName}:{topicName}
  outline: (courseId: string, subjectName: string, topicName: string) => 
    `outline:${courseId}:${subjectName}:${topicName}`,
  
  // Cache course pricing: pricing:{courseId}
  pricing: (courseId: string) => `pricing:${courseId}`,
  
  // User enrollment cache: enrollment:{userId}:{courseId}
  enrollment: (userId: string, courseId: string) => `enrollment:${userId}:${courseId}`,
  
  // AI token usage tracking: tokens:{userId}:{courseId}:{date}
  tokenUsage: (userId: string, courseId: string, date: string) => 
    `tokens:${userId}:${courseId}:${date}`,
} as const;

/**
 * Common TTL values (in seconds)
 */
export const RedisTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;

/**
 * Safe Redis get with error handling
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe Redis set with error handling
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttl?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (ttl) {
      await client.set(key, value, { ex: ttl });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis increment with error handling
 */
export async function redisIncr(key: string): Promise<number | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.incr(key);
    return value;
  } catch (error) {
    console.error(`Redis INCR error for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe Redis delete with error handling
 */
export async function redisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis expire with error handling
 */
export async function redisExpire(key: string, ttl: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.expire(key, ttl);
    return true;
  } catch (error) {
    console.error(`Redis EXPIRE error for key ${key}:`, error);
    return false;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedisClient() !== null;
}
