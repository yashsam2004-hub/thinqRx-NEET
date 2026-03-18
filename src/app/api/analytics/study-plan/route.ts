import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";
import { calculateOverallAnalytics, UserAttempt } from "@/lib/analytics/calculate";
import { generateStudyPlan } from "@/lib/analytics/study-plan";
import { ApiError, handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw ApiError.unauthorized();
    }
    const user = session.user;

    // Get NEET course
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
          message: "Personalized study plans are a Pro-only feature. Upgrade to access.",
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

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        ok: true,
        studyPlan: null,
        message: "No test attempts found. Complete some tests to generate your personalized study plan.",
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

    // Generate comprehensive study plan
    const studyPlan = generateStudyPlan(analytics, 7); // 7 days

    return NextResponse.json({
      ok: true,
      studyPlan,
      summary: {
        totalWeakSpots: studyPlan.weakSpots.length,
        criticalTopics: studyPlan.weakSpots.filter((w) => w.priority === 1).length,
        totalStudyHoursNeeded: studyPlan.weakSpots.reduce((sum, w) => sum + w.estimatedHours, 0),
        nextMilestoneDate: studyPlan.progressMilestones[0]?.targetDate,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
