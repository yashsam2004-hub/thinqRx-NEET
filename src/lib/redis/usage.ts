import {
  getRedisClient,
  RedisKeys,
  RedisTTL,
  redisGet,
  redisSet,
  redisIncr,
} from "./client";

/**
 * Track AI token usage for cost monitoring
 */
export async function trackTokenUsage(
  userId: string,
  courseId: string,
  tokens: number
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const key = RedisKeys.tokenUsage(userId, courseId, date);

    // Increment token count
    await redis.incrby(key, tokens);

    // Set expiry to 90 days for historical data
    await redis.expire(key, RedisTTL.ONE_DAY * 90);

    return true;
  } catch (error) {
    console.error("Track token usage error:", error);
    return false;
  }
}

/**
 * Get token usage for a user/course over a date range
 */
export async function getTokenUsage(
  userId: string,
  courseId: string,
  days: number = 30
): Promise<{ date: string; tokens: number }[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    const results: { date: string; tokens: number }[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const key = RedisKeys.tokenUsage(userId, courseId, dateStr);
      const tokens = await redisGet<number>(key);

      results.push({
        date: dateStr,
        tokens: tokens || 0,
      });
    }

    return results.reverse(); // Oldest first
  } catch (error) {
    console.error("Get token usage error:", error);
    return [];
  }
}

/**
 * Cache syllabus outline
 */
export async function cacheOutline(
  courseId: string,
  subjectName: string,
  topicName: string,
  outline: string[]
): Promise<boolean> {
  const key = RedisKeys.outline(courseId, subjectName, topicName);
  return redisSet(key, outline, RedisTTL.ONE_HOUR);
}

/**
 * Get cached outline
 */
export async function getCachedOutline(
  courseId: string,
  subjectName: string,
  topicName: string
): Promise<string[] | null> {
  const key = RedisKeys.outline(courseId, subjectName, topicName);
  return redisGet<string[]>(key);
}

/**
 * Cache course pricing
 */
export async function cachePricing(
  courseId: string,
  pricing: {
    free: { monthly: number; annual: number };
    plus: { monthly: number; annual: number };
    pro: { monthly: number; annual: number };
  }
): Promise<boolean> {
  const key = RedisKeys.pricing(courseId);
  return redisSet(key, pricing, RedisTTL.ONE_HOUR);
}

/**
 * Get cached pricing
 */
export async function getCachedPricing(courseId: string): Promise<{
  free: { monthly: number; annual: number };
  plus: { monthly: number; annual: number };
  pro: { monthly: number; annual: number };
} | null> {
  const key = RedisKeys.pricing(courseId);
  return redisGet(key);
}

/**
 * Cache user enrollment
 */
export async function cacheEnrollment(
  userId: string,
  courseId: string,
  enrollment: {
    plan: string;
    status: string;
    validUntil: string | null;
  }
): Promise<boolean> {
  const key = RedisKeys.enrollment(userId, courseId);
  return redisSet(key, enrollment, RedisTTL.FIVE_MINUTES);
}

/**
 * Get cached enrollment
 */
export async function getCachedEnrollment(
  userId: string,
  courseId: string
): Promise<{
  plan: string;
  status: string;
  validUntil: string | null;
} | null> {
  const key = RedisKeys.enrollment(userId, courseId);
  return redisGet(key);
}

/**
 * Invalidate enrollment cache (when user upgrades/downgrades)
 */
export async function invalidateEnrollmentCache(
  userId: string,
  courseId: string
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const key = RedisKeys.enrollment(userId, courseId);
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Invalidate enrollment cache error:", error);
    return false;
  }
}

/**
 * Get aggregate usage stats for admin dashboard
 */
export async function getAggregateUsage(
  courseId: string,
  date: string
): Promise<{
  totalTokens: number;
  totalAINotes: number;
  totalPracticeTests: number;
} | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    // This is simplified - in production you'd use Redis streams or time series
    // For now, return placeholder data
    return {
      totalTokens: 0,
      totalAINotes: 0,
      totalPracticeTests: 0,
    };
  } catch (error) {
    console.error("Get aggregate usage error:", error);
    return null;
  }
}

/**
 * Track feature usage for analytics
 */
export async function trackFeatureUsage(
  userId: string,
  courseId: string,
  feature: "ai_notes" | "practice_test" | "mock_test" | "bookmark"
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const date = new Date().toISOString().split("T")[0];
    const key = `feature:${feature}:${courseId}:${date}`;

    await redisIncr(key);
    await redis.expire(key, RedisTTL.ONE_DAY * 90);

    return true;
  } catch (error) {
    console.error("Track feature usage error:", error);
    return false;
  }
}
