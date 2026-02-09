import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuestionResponse, TestSession } from "@/types/mock-test";

export const dynamic = "force-dynamic";

/**
 * PUT /api/mock-tests/[testId]/save
 * Save test progress (auto-save)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { testId } = await params;
    const body = await request.json();
    const { attempt_id, responses, session_state }: {
      attempt_id: string;
      responses: QuestionResponse[];
      session_state: TestSession;
    } = body;

    // Verify attempt belongs to user and is in progress
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("id", attempt_id)
      .eq("user_id", user.id)
      .eq("mock_test_id", testId)
      .eq("status", "in_progress")
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { ok: false, message: "Attempt not found or already submitted" },
        { status: 404 }
      );
    }

    // Calculate time spent
    const startTime = new Date(attempt.started_at).getTime();
    const currentTime = new Date().getTime();
    const timeSpentSeconds = Math.floor((currentTime - startTime) / 1000);

    // Update attempt with responses and session state
    const { error: updateError } = await supabase
      .from("mock_test_attempts")
      .update({
        responses,
        session_state,
        time_spent_seconds: timeSpentSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt_id);

    if (updateError) {
      console.error("Error updating attempt:", updateError);
      return NextResponse.json(
        { ok: false, message: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Progress saved",
    });
  } catch (error) {
    console.error("Error in PUT /api/mock-tests/[testId]/save:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
