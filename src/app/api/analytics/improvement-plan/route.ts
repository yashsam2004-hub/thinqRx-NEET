import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";
import { calculateOverallAnalytics, UserAttempt } from "@/lib/analytics/calculate";
import { generateImprovementPlan } from "@/lib/analytics/improvement-plan";
import { ApiError, handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

const reqSchema = z.object({
  targetRank: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth (use getSession for reliable SSR)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw ApiError.unauthorized();
    }
    const user = session.user;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.invalidRequest("Invalid request data", parsed.error.issues);
    }

    const { targetRank } = parsed.data;

    // Get NEET course (default)
    const { data: neetCourse } = await supabase
      .from("courses")
      .select("id")
      .ilike("code", "neet")
      .single();

    const courseId = neetCourse?.id;
    if (!courseId) {
      throw ApiError.notFound("Course not found");
    }

    // Check if user has Pro plan
    const userPlan = await getUserPlan(user.id, courseId);
    if (userPlan !== "pro") {
      return NextResponse.json(
        {
          ok: false,
          error: "PREMIUM_FEATURE",
          message: "AI-powered improvement plans are a Pro-only feature. Upgrade to access.",
        },
        { status: 403 }
      );
    }

    // Fetch user attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("user_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (attemptsError) {
      throw ApiError.databaseError("Failed to fetch attempts", attemptsError);
    }

    if (!attempts || attempts.length < 3) {
      return NextResponse.json({
        ok: true,
        plan: null,
        message: "Complete at least 3 tests to generate a personalized improvement plan.",
      });
    }

    // Fetch topic metadata
    const topicIds = Array.from(
      new Set(
        attempts
          .filter((a) => a.kind === "ai_topic" && a.source_id)
          .map((a) => a.source_id)
      )
    );

    const { data: topics } = await supabase
      .from("syllabus_topics")
      .select("id, name, syllabus_subjects(name)")
      .in("id", topicIds);

    const topicMetadata = new Map(
      (topics || []).map((t: any) => [
        t.id,
        {
          name: t.name,
          subjectName: t.syllabus_subjects?.name || "Unknown",
        },
      ])
    );

    // Calculate analytics
    const userAttempts: UserAttempt[] = attempts.map((a) => ({
      id: a.id,
      userId: a.user_id,
      courseId: a.course_id,
      kind: a.kind,
      sourceId: a.source_id || undefined,
      mockTestId: a.mock_test_id || undefined,
      score: a.score,
      maxScore: a.max_score || undefined,
      timeTakenSeconds: a.time_taken_seconds,
      responsesJson: a.responses_json as any,
      createdAt: a.created_at,
    }));

    const analytics = calculateOverallAnalytics(userAttempts, topicMetadata);

    // Generate improvement plan (rank prediction now handled internally)
    const plan = await generateImprovementPlan(analytics, undefined, targetRank);

    return NextResponse.json({
      ok: true,
      plan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
