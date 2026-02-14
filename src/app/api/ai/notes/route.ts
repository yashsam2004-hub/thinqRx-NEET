import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateNotes } from "@/lib/ai/generateNotes";
import { notesSchema } from "@/lib/ai/schemas";
import { checkAINotesLimit, incrementAINotesLimit } from "@/lib/redis/rate-limit";
import { getUserPlan, hasAccessToCourse, canAccessPremiumContent } from "@/lib/enrollments";
import { trackTokenUsage, trackFeatureUsage } from "@/lib/redis/usage";

export const dynamic = "force-dynamic";

const reqSchema = z.object({
  topicId: z.string().uuid(),
  courseId: z.string().uuid().optional(), // Optional for backward compatibility
  forceRegenerate: z.boolean().optional(),
});

async function getOutline(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  courseCode: string,
  subjectName: string,
  topicName: string,
) {
  const code = courseCode || "gpat";

  const { data: direct } = await supabase
    .from("syllabus_outlines")
    .select("outline")
    .eq("course_code", code)
    .eq("subject_name", subjectName)
    .eq("topic_name", topicName)
    .maybeSingle();

  if (direct?.outline && Array.isArray(direct.outline)) {
    return direct.outline as string[];
  }

  const { data: subjectDefault } = await supabase
    .from("syllabus_outlines")
    .select("outline")
    .eq("course_code", code)
    .eq("subject_name", subjectName)
    .eq("topic_name", "_default")
    .eq("is_default", true)
    .maybeSingle();

  if (subjectDefault?.outline && Array.isArray(subjectDefault.outline)) {
    return subjectDefault.outline as string[];
  }

  const { data: globalDefault } = await supabase
    .from("syllabus_outlines")
    .select("outline")
    .eq("course_code", code)
    .eq("subject_name", "_default")
    .eq("is_default", true)
    .maybeSingle();

  if (globalDefault?.outline && Array.isArray(globalDefault.outline)) {
    return globalDefault.outline as string[];
  }

  return [];
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Invalid notes request:", {
      body,
      errors: parsed.error.flatten(),
    });
    return NextResponse.json(
      { 
        ok: false, 
        error: "INVALID_REQUEST",
        message: "Invalid request format. Please ensure topicId is a valid UUID.",
        details: parsed.error.flatten().fieldErrors,
      }, 
      { status: 400 }
    );
  }

  let { courseId, topicId, forceRegenerate } = parsed.data;

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

  // Check course access (can view course)
  const hasAccess = await hasAccessToCourse(auth.user.id, validCourseId);
  if (!hasAccess) {
    return NextResponse.json(
      { ok: false, error: "COURSE_ACCESS_DENIED" },
      { status: 403 }
    );
  }

  // Get user's plan for this course
  const plan = await getUserPlan(auth.user.id, validCourseId);

  // Check rate limits (plan-based)
  const rateLimit = await checkAINotesLimit(auth.user.id, validCourseId, plan);
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
    .select("id,name,is_free_preview,subject_id,course_id,syllabus_subjects(name)")
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
        { ok: false, error: "PREMIUM_REQUIRED", message: "Upgrade to Plus or Pro to access this topic" },
        { status: 403 }
      );
    }
  }

  const subjectName = (topic.syllabus_subjects as { name?: string })?.name || "General";

  const { data: courseRow } = await supabase
    .from("courses")
    .select("code")
    .eq("id", validCourseId)
    .maybeSingle();
  const courseCode = courseRow?.code ?? "gpat";

  if (!forceRegenerate) {
    const { data: cached } = await supabase
      .from("ai_notes")
      .select("id,content_json,created_at")
      .eq("user_id", auth.user.id)
      .eq("topic_id", topic.id)
      .eq("course_id", validCourseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.content_json && typeof cached.content_json === "object") {
      const parsedCache = notesSchema.safeParse(cached.content_json);
      if (parsedCache.success) {
        return NextResponse.json({
          ok: true,
          fromCache: true,
          ...parsedCache.data,
        });
      }
    }
  }

  // CRITICAL: Get outline from syllabus_outlines table (SINGLE SOURCE OF TRUTH)
  const outline = await getOutline(supabase, courseCode, subjectName, topic.name);
  
  // If no outline exists in database, use Quick Revision default structure
  const finalOutline = outline.length > 0 ? outline : [
    "Exam Definition",
    "Classification & Types",
    "Key Mechanisms",
    "High-Yield Comparisons",
    "Common Exam Traps",
    "Rapid Revision Facts",
    "GPAT-Style MCQs",
  ];
  
  console.log(`📋 Using ${outline.length > 0 ? 'database' : 'default'} outline with ${finalOutline.length} sections`);

  try {
    const data = await generateNotes({
      topicId: topic.id,
      topicName: topic.name,
      subjectName,
      outline: finalOutline,
    });

    // Track token usage (estimate ~500 tokens per note generation)
    const estimatedTokens = 500;
    await trackTokenUsage(auth.user.id, validCourseId, estimatedTokens);

    // Insert into database with course_id
    await supabase.from("ai_notes").insert({
      user_id: auth.user.id,
      topic_id: topic.id,
      course_id: validCourseId,
      content_json: data,
    });

    // Track feature usage
    await trackFeatureUsage(auth.user.id, validCourseId, "ai_notes");

    // Analytics event
    await supabase.from("analytics_events").insert({
      user_id: auth.user.id,
      event_name: "ai_notes_generated",
      event_json: {
        topic_id: topic.id,
        course_id: validCourseId,
        tokens_used: estimatedTokens,
        format: "json_v2",
        plan,
      },
    });

    // CRITICAL: Increment rate limit ONLY after successful generation and save
    await incrementAINotesLimit(auth.user.id, validCourseId);

    return NextResponse.json({
      ok: true,
      fromCache: false,
      remaining: rateLimit.remaining - 1, // Adjust remaining count
      ...data,
    });
  } catch (error) {
    console.error("AI notes generation error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const message =
      error instanceof Error ? error.message : "Failed to generate notes";
    
    return NextResponse.json(
      { 
        ok: false, 
        error: "AI_GENERATION_FAILED", 
        message,
        details: error instanceof Error ? error.name : undefined,
      },
      { status: 500 },
    );
  }
}
