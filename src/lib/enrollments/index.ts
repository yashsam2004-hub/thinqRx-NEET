import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCachedEnrollment, cacheEnrollment } from "@/lib/redis/usage";
import type { Plan } from "@/lib/redis/rate-limit";

export interface UserEnrollment {
  enrollmentId: string;
  userId: string;
  courseId: string;
  plan: Plan;
  status: "active" | "expired" | "cancelled";
  validUntil: string | null;
  billingCycle: "monthly" | "annual" | null;
}

/**
 * Get user's enrollment for a specific course
 */
export async function getUserEnrollment(
  userId: string,
  courseId: string
): Promise<UserEnrollment | null> {
  // Try cache first
  const cached = await getCachedEnrollment(userId, courseId);
  if (cached) {
    return {
      enrollmentId: "", // Not stored in cache
      userId,
      courseId,
      plan: cached.plan as Plan,
      status: cached.status as "active" | "expired" | "cancelled",
      validUntil: cached.validUntil,
      billingCycle: null,
    };
  }

  // Query database
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const enrollment: UserEnrollment = {
    enrollmentId: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    plan: data.plan as Plan,
    status: data.status,
    validUntil: data.valid_until,
    billingCycle: data.billing_cycle,
  };

  // Cache for future requests
  await cacheEnrollment(userId, courseId, {
    plan: enrollment.plan,
    status: enrollment.status,
    validUntil: enrollment.validUntil,
  });

  return enrollment;
}

/**
 * Check if user has access to a course
 */
export async function hasAccessToCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const enrollment = await getUserEnrollment(userId, courseId);

  if (!enrollment) {
    // No enrollment = free access
    return true;
  }

  // Check if enrollment is active
  if (enrollment.status !== "active") {
    return false;
  }

  // Check if enrollment hasn't expired
  if (enrollment.validUntil) {
    const expiryDate = new Date(enrollment.validUntil);
    if (expiryDate < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * Get user's plan for a course (returns 'free' if not enrolled)
 */
export async function getUserPlan(
  userId: string,
  courseId: string
): Promise<Plan> {
  const enrollment = await getUserEnrollment(userId, courseId);

  if (!enrollment || enrollment.status !== "active") {
    return "free";
  }

  // Check expiry
  if (enrollment.validUntil) {
    const expiryDate = new Date(enrollment.validUntil);
    if (expiryDate < new Date()) {
      return "free";
    }
  }

  return enrollment.plan;
}

/**
 * Check if user can access premium content (any paid plan)
 * Includes: plus, pro, and all exam packs
 */
export async function canAccessPremiumContent(
  userId: string,
  courseId: string
): Promise<boolean> {
  const plan = await getUserPlan(userId, courseId);
  // Any plan except "free" grants premium access
  return plan !== "free";
}

/**
 * Get all user enrollments
 */
export async function getUserEnrollments(
  userId: string
): Promise<UserEnrollment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    enrollmentId: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    plan: row.plan as Plan,
    status: row.status,
    validUntil: row.valid_until,
    billingCycle: row.billing_cycle,
  }));
}

/**
 * Create or update enrollment (for payment processing)
 */
export async function upsertEnrollment(
  userId: string,
  courseId: string,
  plan: Plan,
  billingCycle: "monthly" | "annual",
  validUntil: Date
): Promise<UserEnrollment | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("course_enrollments")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        plan,
        billing_cycle: billingCycle,
        status: "active",
        valid_until: validUntil.toISOString(),
      },
      {
        onConflict: "user_id,course_id",
      }
    )
    .select()
    .single();

  if (error || !data) {
    console.error("Upsert enrollment error:", error);
    return null;
  }

  return {
    enrollmentId: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    plan: data.plan as Plan,
    status: data.status,
    validUntil: data.valid_until,
    billingCycle: data.billing_cycle,
  };
}

/**
 * Cancel enrollment
 */
export async function cancelEnrollment(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("course_enrollments")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Cancel enrollment error:", error);
    return false;
  }

  return true;
}

/**
 * Check if user needs to show upgrade prompt
 */
export async function shouldShowUpgradePrompt(
  userId: string,
  courseId: string,
  feature: "ai_notes" | "practice_test" | "mock_test" | "full_topic_access"
): Promise<boolean> {
  const plan = await getUserPlan(userId, courseId);

  switch (feature) {
    case "full_topic_access":
      return plan === "free";
    case "ai_notes":
    case "practice_test":
      // Free users can use but with limits
      return false;
    case "mock_test":
      // Free users have very limited mock tests
      return plan === "free";
    default:
      return false;
  }
}
