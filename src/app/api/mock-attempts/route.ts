import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mockTestId, score, maxScore, timeTaken, responses, metadata } = body;

    if (!mockTestId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Get mock test to find course_id
    const { data: mockTest } = await supabase
      .from("mock_tests")
      .select("course_id")
      .eq("id", mockTestId)
      .single();

    if (!mockTest) {
      return NextResponse.json(
        { ok: false, error: "MOCK_TEST_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Insert attempt
    const { data: attempt, error: insertError } = await supabase
      .from("user_attempts")
      .insert({
        user_id: auth.user.id,
        course_id: mockTest.course_id,
        kind: "mock_test",
        mock_test_id: mockTestId,
        score,
        max_score: maxScore,
        time_taken_seconds: timeTaken,
        responses_json: {
          responses,
          metadata,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting attempt:", insertError);
      return NextResponse.json(
        { ok: false, error: "INSERT_FAILED", message: insertError.message },
        { status: 500 }
      );
    }

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: auth.user.id,
      event_name: "mock_test_completed",
      event_json: {
        attempt_id: attempt.id,
        mock_test_id: mockTestId,
        score,
        max_score: maxScore,
        time_taken: timeTaken,
        ...metadata,
      },
    });

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
    });
  } catch (error: any) {
    console.error("Error in mock-attempts API:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
