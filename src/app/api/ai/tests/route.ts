import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateTest } from "@/lib/ai/generateTest";
import { testSchema } from "@/lib/ai/schemas";
import { checkPracticeTestLimit } from "@/lib/redis/rate-limit";
import { getUserPlan, hasAccessToCourse, canAccessPremiumContent } from "@/lib/enrollments";
import { trackTokenUsage, trackFeatureUsage } from "@/lib/redis/usage";

const reqSchema = z.object({
  topicId: z.string().uuid(),
  courseId: z.string().uuid().optional(), // Optional for backward compatibility
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(10),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  console.log("[AI Tests] Request body:", body);
  
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[AI Tests] Validation failed:", parsed.error.issues);
    return NextResponse.json({ 
      ok: false, 
      error: "INVALID_REQUEST",
      details: parsed.error.issues,
      message: "Invalid request parameters"
    }, { status: 400 });
  }
  
  console.log("[AI Tests] Parsed data:", parsed.data);

  let { topicId, courseId, difficulty, count, forceRegenerate } = parsed.data;

  // If courseId not provided, fetch from topic (backward compatibility)
  if (!courseId) {
    const { data: topicData } = await supabase
      .from("syllabus_topics")
      .select("course_id")
      .eq("id", topicId)
      .maybeSingle();
    
    if (!topicData?.course_id) {
      return NextResponse.json(
        { ok: false, error: "TOPIC_NOT_FOUND" },
        { status: 404 }
      );
    }
    courseId = topicData.course_id;
  }

  // At this point courseId is guaranteed to be a string
  const validCourseId: string = courseId!;

  // Check course access
  const hasAccess = await hasAccessToCourse(auth.user.id, validCourseId);
  if (!hasAccess) {
    return NextResponse.json(
      { ok: false, error: "COURSE_ACCESS_DENIED" },
      { status: 403 }
    );
  }

  // Get user's plan for this course
  const plan = await getUserPlan(auth.user.id, validCourseId);

  // Check plan-based limits
  const maxQuestions = plan === "free" ? 10 : 20;
  if (count > maxQuestions) {
    return NextResponse.json(
      {
        ok: false,
        error: "QUESTION_LIMIT_EXCEEDED",
        message: `Your ${plan} plan allows maximum ${maxQuestions} questions`,
      },
      { status: 403 }
    );
  }

  // Check rate limits
  const rateLimit = await checkPracticeTestLimit(auth.user.id, validCourseId, plan);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "RATE_LIMITED",
        message: rateLimit.reason,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
      { status: 429 }
    );
  }

  const { data: topic } = await supabase
    .from("syllabus_topics")
    .select("id,name,subject_id,course_id,is_free_preview,syllabus_subjects(name)")
    .eq("id", topicId)
    .eq("course_id", validCourseId)
    .maybeSingle();

  if (!topic) {
    return NextResponse.json({ ok: false, error: "TOPIC_NOT_FOUND" }, { status: 404 });
  }

  // Check topic access: non-preview topics require premium access (Plus or Pro plan)
  if (!topic.is_free_preview) {
    const hasPremium = await canAccessPremiumContent(auth.user.id, validCourseId);
    if (!hasPremium) {
      return NextResponse.json(
        { ok: false, error: "PREMIUM_REQUIRED", message: "Upgrade to Plus or Pro to generate tests for this topic" },
        { status: 403 }
      );
    }
  }

  const subjectName = (topic.syllabus_subjects as { name?: string })?.name || "General";

  if (!forceRegenerate) {
    const { data: cached } = await supabase
      .from("ai_tests")
      .select("id,content_json,created_at")
      .eq("user_id", auth.user.id)
      .eq("course_id", validCourseId)
      .contains("topic_ids", [topicId])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.content_json && typeof cached.content_json === "object") {
      const parsedCache = testSchema.safeParse(cached.content_json);
      if (parsedCache.success) {
        return NextResponse.json({
          ok: true,
          fromCache: true,
          testId: cached.id,
          test: parsedCache.data,
          remaining: rateLimit.remaining,
        });
      }
    }
  }

  try {
    const test = await generateTest({
      topicId: topic.id,
      topicName: topic.name,
      subjectName,
      difficulty,
      count,
    });

    // Track token usage (estimate ~30 tokens per question)
    const estimatedTokens = count * 30;
    await trackTokenUsage(auth.user.id, validCourseId, estimatedTokens);

    // Track feature usage
    await trackFeatureUsage(auth.user.id, validCourseId, "practice_test");

    const { data: inserted } = await supabase
      .from("ai_tests")
      .insert({
        user_id: auth.user.id,
        course_id: validCourseId,
        topic_ids: [topic.id],
        params_json: { count, difficulty, subject: subjectName },
        content_json: test,
      })
      .select("id")
      .single();

    await supabase.from("analytics_events").insert({
      user_id: auth.user.id,
      event_name: "ai_test_generated",
      event_json: {
        topic_id: topic.id,
        course_id: validCourseId,
        subject: subjectName,
        difficulty,
        count,
        tokens_used: estimatedTokens,
        format: "json_v2",
        plan,
      },
    });

    return NextResponse.json({
      ok: true,
      fromCache: false,
      testId: inserted?.id ?? null,
      test,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate test";
    return NextResponse.json(
      { ok: false, error: "AI_GENERATION_FAILED", message },
      { status: 500 },
    );
  }
}
