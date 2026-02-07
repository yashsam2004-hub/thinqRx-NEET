import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRedisClient, RedisKeys } from "@/lib/redis/client";

export interface CouponValidation {
  valid: boolean;
  discountPercent: number;
  message?: string;
  coupon?: {
    id: string;
    code: string;
    discountPercent: number;
    courseId: string | null;
    maxUses: number;
    usedCount: number;
    expiresAt: string | null;
  };
}

/**
 * Validate coupon code
 */
export async function validateCoupon(
  code: string,
  courseId: string,
  userId: string
): Promise<CouponValidation> {
  const supabase = await createSupabaseServerClient();

  // Fetch coupon from database
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error || !coupon) {
    return {
      valid: false,
      discountPercent: 0,
      message: "Invalid coupon code",
    };
  }

  // Check if coupon is active
  if (!coupon.is_active) {
    return {
      valid: false,
      discountPercent: 0,
      message: "This coupon is no longer active",
    };
  }

  // Check if coupon is expired
  if (coupon.expires_at) {
    const expiryDate = new Date(coupon.expires_at);
    if (expiryDate < new Date()) {
      return {
        valid: false,
        discountPercent: 0,
        message: "This coupon has expired",
      };
    }
  }

  // Check if coupon is course-specific
  if (coupon.course_id && coupon.course_id !== courseId) {
    return {
      valid: false,
      discountPercent: 0,
      message: "This coupon is not valid for this course",
    };
  }

  // Check usage limit
  if (coupon.used_count >= coupon.max_uses) {
    return {
      valid: false,
      discountPercent: 0,
      message: "This coupon has reached its usage limit",
    };
  }

  // Check if user has already used this coupon for this course (prevent reuse)
  const redis = getRedisClient();
  if (redis) {
    const userCouponKey = `coupon:used:${userId}:${courseId}:${code}`;
    const alreadyUsed = await redis.get(userCouponKey);
    if (alreadyUsed) {
      return {
        valid: false,
        discountPercent: 0,
        message: "You have already used this coupon for this course",
      };
    }
  }

  return {
    valid: true,
    discountPercent: coupon.discount_percent,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discount_percent,
      courseId: coupon.course_id,
      maxUses: coupon.max_uses,
      usedCount: coupon.used_count,
      expiresAt: coupon.expires_at,
    },
  };
}

/**
 * Apply coupon (increment usage count)
 */
export async function applyCoupon(
  code: string,
  courseId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // Increment used_count
  const { error } = await supabase.rpc("increment_coupon_usage", {
    p_code: code.toUpperCase(),
  });

  if (error) {
    console.error("Apply coupon error:", error);
    return false;
  }

  // Mark as used by this user (prevent reuse) - expires after 1 year
  const redis = getRedisClient();
  if (redis) {
    const userCouponKey = `coupon:used:${userId}:${courseId}:${code}`;
    await redis.set(userCouponKey, 1, { ex: 365 * 24 * 60 * 60 });
  }

  return true;
}

// Re-export from utils
export { calculateDiscountedPrice } from "./utils";
