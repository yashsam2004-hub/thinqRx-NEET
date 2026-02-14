import {
  getRedisClient,
  RedisKeys,
  RedisTTL,
  redisGet,
  redisSet,
  redisIncr,
  redisExpire,
} from "./client";
import { getPlanFeatures, type PlanFeatures } from "@/lib/plans/features";

/**
 * DYNAMIC Plan-based rate limits
 * 
 * Limits are now fetched from the database 'plans' table features JSON.
 * This allows admins to configure limits without code changes.
 * 
 * Rules:
 * - Free: Limited access (5 notes/day, 3 tests/day, no mock tests)
 * - Plus: Unlimited notes/tests, but NO mock tests
 * - Pro: Everything unlimited
 * - Exam Packs (gpat_last_minute, gpat_2027_full): As configured in DB
 */

export type Plan = string; // Now accepts any plan ID from database

/**
 * Get plan limits from database features
 */
async function getPlanLimits(plan: Plan): Promise<{
  aiNotesPerDay: number;
  practiceTestsPerDay: number;
  mockTestsPerMonth: number;
}> {
  const features = await getPlanFeatures(plan);
  
  return {
    aiNotesPerDay: features.ai_notes_limit ?? -1,
    practiceTestsPerDay: features.practice_tests_limit ?? -1,
    mockTestsPerMonth: features.mock_tests_limit ?? (features.mock_tests_access ? -1 : 0),
  };
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  total: number;
  resetAt: Date;
  reason?: string;
}

/**
 * Get current date string for daily limits (YYYY-MM-DD)
 */
function getDayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get current month string for monthly limits (YYYY-MM)
 */
function getMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Check AI notes generation rate limit (READ-ONLY, does NOT increment)
 * Call incrementAINotesLimit() after successful generation
 */
export async function checkAINotesLimit(
  userId: string,
  courseId: string,
  plan: Plan
): Promise<RateLimitResult> {
  // Get dynamic limits from database
  const limits = await getPlanLimits(plan);
  const limit = limits.aiNotesPerDay;

  // Unlimited (-1)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      total: -1,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }

  const redis = getRedisClient();
  if (!redis) {
    // If Redis unavailable, allow but with warning
    console.warn("Redis unavailable - rate limiting disabled");
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }

  const dayKey = getDayKey();
  const key = `${RedisKeys.aiLimit(userId, courseId)}:${dayKey}`;

  try {
    // Get current usage (READ-ONLY)
    const current = await redisGet<number>(key);
    const usage = current || 0;

    // Calculate reset time (end of day UTC)
    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setUTCHours(23, 59, 59, 999);

    if (usage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        total: limit,
        resetAt,
        reason: `Daily limit of ${limit} AI notes reached. Upgrade to Plus or Pro for more.`,
      };
    }

    return {
      allowed: true,
      remaining: limit - usage,
      total: limit,
      resetAt,
    };
  } catch (error) {
    console.error("AI notes rate limit error:", error);
    // On error, allow the request
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }
}

/**
 * Increment AI notes counter AFTER successful generation
 */
export async function incrementAINotesLimit(
  userId: string,
  courseId: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const dayKey = getDayKey();
  const key = `${RedisKeys.aiLimit(userId, courseId)}:${dayKey}`;

  try {
    const current = await redisGet<number>(key);
    await redisIncr(key);

    // Set expiry if this is the first request of the day
    if (!current || current === 0) {
      const now = new Date();
      const resetAt = new Date(now);
      resetAt.setUTCHours(23, 59, 59, 999);
      const secondsUntilMidnight = Math.floor(
        (resetAt.getTime() - now.getTime()) / 1000
      );
      await redisExpire(key, secondsUntilMidnight);
    }
  } catch (error) {
    console.error("Failed to increment AI notes limit:", error);
  }
}

/**
 * Check practice test generation rate limit (READ-ONLY, does NOT increment)
 * Call incrementPracticeTestLimit() after successful generation
 */
export async function checkPracticeTestLimit(
  userId: string,
  courseId: string,
  plan: Plan
): Promise<RateLimitResult> {
  // Get dynamic limits from database
  const limits = await getPlanLimits(plan);
  const limit = limits.practiceTestsPerDay;

  // Unlimited (-1)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      total: -1,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }

  const redis = getRedisClient();
  if (!redis) {
    console.warn("Redis unavailable - rate limiting disabled");
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }

  const dayKey = getDayKey();
  const key = `${RedisKeys.testLimit(userId, courseId)}:${dayKey}`;

  try {
    const current = await redisGet<number>(key);
    const usage = current || 0;

    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setUTCHours(23, 59, 59, 999);

    if (usage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        total: limit,
        resetAt,
        reason: `Daily limit of ${limit} practice tests reached. Upgrade for more.`,
      };
    }

    return {
      allowed: true,
      remaining: limit - usage,
      total: limit,
      resetAt,
    };
  } catch (error) {
    console.error("Practice test rate limit error:", error);
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 1000),
    };
  }
}

/**
 * Increment practice test counter AFTER successful generation
 */
export async function incrementPracticeTestLimit(
  userId: string,
  courseId: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const dayKey = getDayKey();
  const key = `${RedisKeys.testLimit(userId, courseId)}:${dayKey}`;

  try {
    const current = await redisGet<number>(key);
    await redisIncr(key);

    // Set expiry if this is the first request of the day
    if (!current || current === 0) {
      const now = new Date();
      const resetAt = new Date(now);
      resetAt.setUTCHours(23, 59, 59, 999);
      const secondsUntilMidnight = Math.floor(
        (resetAt.getTime() - now.getTime()) / 1000
      );
      await redisExpire(key, secondsUntilMidnight);
    }
  } catch (error) {
    console.error("Failed to increment practice test limit:", error);
  }
}

/**
 * Check mock test attempt rate limit
 */
export async function checkMockTestLimit(
  userId: string,
  courseId: string,
  testId: string,
  plan: Plan
): Promise<RateLimitResult> {
  // Get dynamic limits from database
  const limits = await getPlanLimits(plan);
  const limit = limits.mockTestsPerMonth;

  // Unlimited (-1)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      total: -1,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 30 * 1000),
    };
  }

  const redis = getRedisClient();
  if (!redis) {
    console.warn("Redis unavailable - rate limiting disabled");
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 30 * 1000),
    };
  }

  const monthKey = getMonthKey();
  const key = `${RedisKeys.mockAttempt(userId, courseId, testId)}:${monthKey}`;

  try {
    const current = await redisGet<number>(key);
    const usage = current || 0;

    // Calculate reset time (end of month)
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (usage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        total: limit,
        resetAt,
        reason: `Monthly limit of ${limit} mock test${limit > 1 ? "s" : ""} reached. Upgrade for more.`,
      };
    }

    await redisIncr(key);

    if (usage === 0) {
      const secondsUntilMonthEnd = Math.floor(
        (resetAt.getTime() - now.getTime()) / 1000
      );
      await redisExpire(key, secondsUntilMonthEnd);
    }

    return {
      allowed: true,
      remaining: limit - usage - 1,
      total: limit,
      resetAt,
    };
  } catch (error) {
    console.error("Mock test rate limit error:", error);
    return {
      allowed: true,
      remaining: limit,
      total: limit,
      resetAt: new Date(Date.now() + RedisTTL.ONE_DAY * 30 * 1000),
    };
  }
}

/**
 * Get user's current usage stats for a course
 */
export async function getUserUsageStats(
  userId: string,
  courseId: string,
  plan: Plan
): Promise<{
  aiNotes: { used: number; limit: number; remaining: number };
  practiceTests: { used: number; limit: number; remaining: number };
  mockTests: { used: number; limit: number; remaining: number };
}> {
  // Get dynamic limits from database
  const limits = await getPlanLimits(plan);
  const aiLimit = limits.aiNotesPerDay;
  const testLimit = limits.practiceTestsPerDay;
  const mockLimit = limits.mockTestsPerMonth;

  const redis = getRedisClient();

  if (!redis) {
    return {
      aiNotes: { used: 0, limit: aiLimit, remaining: aiLimit === -1 ? -1 : aiLimit },
      practiceTests: { used: 0, limit: testLimit, remaining: testLimit === -1 ? -1 : testLimit },
      mockTests: { used: 0, limit: mockLimit, remaining: mockLimit === -1 ? -1 : mockLimit },
    };
  }

  try {
    const dayKey = getDayKey();
    const monthKey = getMonthKey();

    const aiKey = `${RedisKeys.aiLimit(userId, courseId)}:${dayKey}`;
    const testKey = `${RedisKeys.testLimit(userId, courseId)}:${dayKey}`;
    // For mock tests, we need to count all attempts in the month
    // This is simplified - in production you'd track per test

    const [aiUsed, testUsed] = await Promise.all([
      redisGet<number>(aiKey),
      redisGet<number>(testKey),
    ]);

    return {
      aiNotes: {
        used: aiUsed || 0,
        limit: aiLimit,
        remaining: aiLimit === -1 ? -1 : Math.max(0, aiLimit - (aiUsed || 0)),
      },
      practiceTests: {
        used: testUsed || 0,
        limit: testLimit,
        remaining: testLimit === -1 ? -1 : Math.max(0, testLimit - (testUsed || 0)),
      },
      mockTests: {
        used: 0, // Simplified
        limit: mockLimit,
        remaining: mockLimit === -1 ? -1 : mockLimit,
      },
    };
  } catch (error) {
    console.error("Get usage stats error:", error);
    return {
      aiNotes: { used: 0, limit: aiLimit, remaining: aiLimit === -1 ? -1 : aiLimit },
      practiceTests: { used: 0, limit: testLimit, remaining: testLimit === -1 ? -1 : testLimit },
      mockTests: { used: 0, limit: mockLimit, remaining: mockLimit === -1 ? -1 : mockLimit },
    };
  }
}

/**
 * Reset user's rate limits for a course (admin only)
 */
export async function resetUserLimits(
  userId: string,
  courseId: string
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const dayKey = getDayKey();
    const monthKey = getMonthKey();

    await Promise.all([
      redis.del(`${RedisKeys.aiLimit(userId, courseId)}:${dayKey}`),
      redis.del(`${RedisKeys.testLimit(userId, courseId)}:${dayKey}`),
    ]);

    return true;
  } catch (error) {
    console.error("Reset limits error:", error);
    return false;
  }
}
