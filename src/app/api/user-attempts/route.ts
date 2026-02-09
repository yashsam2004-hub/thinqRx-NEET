import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check auth (use getSession for reliable SSR)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = session.user;

  try {
    const body = await request.json();
    const { topicId, kind, score, timeTaken, responses, metadata } = body;

    console.log("[User Attempts] Saving attempt:", {
      userId: user.id,
      topicId,
      kind,
      score,
      timeTaken,
      responsesCount: responses?.length || 0,
      metadata,
    });

    if (!topicId || !kind) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Get course_id from topic
    const { data: topic, error: topicError } = await supabase
      .from("syllabus_topics")
      .select("course_id, name")
      .eq("id", topicId)
      .single();

    if (topicError) {
      console.error("[User Attempts] Topic fetch error:", topicError);
    }

    if (!topic) {
      return NextResponse.json(
        { ok: false, error: "TOPIC_NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("[User Attempts] Topic found:", topic);

    // Calculate max_score from metadata
    const maxScore = metadata?.totalQuestions 
      ? metadata.totalQuestions * 4  // Assuming 4 marks per question
      : score * 5; // Fallback estimate
    
    // Insert attempt
    const attemptData = {
      user_id: user.id,
      course_id: topic.course_id,
      kind,
      source_id: topicId,
      score,
      max_score: maxScore,
      time_taken_seconds: timeTaken,
      responses_json: {
        responses,
        metadata,
      },
    };

    console.log("[User Attempts] Inserting:", attemptData);

    const { data: attempt, error: insertError } = await supabase
      .from("user_attempts")
      .insert(attemptData)
      .select("id")
      .single();

    if (insertError) {
      console.error("[User Attempts] Insert error:", insertError);
      return NextResponse.json(
        { ok: false, error: "INSERT_FAILED", message: insertError.message, details: insertError },
        { status: 500 }
      );
    }

    console.log("[User Attempts] Success! Attempt ID:", attempt.id);

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "test_completed",
      event_json: {
        attempt_id: attempt.id,
        topic_id: topicId,
        kind,
        score,
        time_taken: timeTaken,
        ...metadata,
      },
    });

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
    });
  } catch (error: any) {
    console.error("Error in user-attempts API:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
