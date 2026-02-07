import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";

/**
 * POST /api/mock-tests/[testId]/start
 * Start a new test or resume existing attempt
 */
export async function POST(
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

    // Get mock test details
    const { data: mockTest, error: testError } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", testId)
      .eq("status", "published")
      .single();

    if (testError || !mockTest) {
      return NextResponse.json(
        { ok: false, message: "Test not found or not published" },
        { status: 404 }
      );
    }

    // Check user's plan
    const userPlan = await getUserPlan(user.id, mockTest.course_id);
    
    // Free users: NO access
    if (userPlan === "free") {
      return NextResponse.json(
        { ok: false, message: "Mock tests are available for Plus and Pro members" },
        { status: 403 }
      );
    }

    // Plus users: Can attempt only 1 mock test
    if (userPlan === "plus") {
      // Check how many different mock tests they've attempted
      const { data: previousAttempts, error: attemptsError } = await supabase
        .from("mock_test_attempts")
        .select("mock_test_id")
        .eq("user_id", user.id)
        .neq("mock_test_id", testId); // Exclude current test

      if (attemptsError) {
        console.error("Error checking previous attempts:", attemptsError);
      }

      // Get unique test IDs
      const uniqueTests = new Set(previousAttempts?.map(a => a.mock_test_id) || []);
      
      if (uniqueTests.size >= 1) {
        return NextResponse.json(
          { 
            ok: false, 
            message: "Plus members can attempt only 1 mock test. Upgrade to Pro for unlimited access.",
            requiresUpgrade: true
          },
          { status: 403 }
        );
      }
    }

    // Pro users: All tests allowed (no additional checks needed)

    // Check for existing active attempt
    const { data: existingAttempt } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("mock_test_id", testId)
      .eq("status", "in_progress")
      .single();

    // If active attempt exists, return it for resume
    if (existingAttempt) {
      return NextResponse.json({
        ok: true,
        mode: "resume",
        attempt: existingAttempt,
        test: mockTest,
        message: "Resuming previous attempt",
      });
    }

    // Create new attempt
    const { data: newAttempt, error: attemptError } = await supabase
      .from("mock_test_attempts")
      .insert({
        user_id: user.id,
        mock_test_id: testId,
        course_id: mockTest.course_id,
        started_at: new Date().toISOString(),
        time_spent_seconds: 0,
        responses: [],
        score: 0,
        max_score: mockTest.total_marks,
        accuracy_percentage: 0,
        status: "in_progress",
        session_state: {
          current_question_index: 0,
          time_remaining_seconds: mockTest.duration_minutes * 60,
          question_states: [],
          last_saved_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (attemptError || !newAttempt) {
      console.error("Error creating attempt:", attemptError);
      return NextResponse.json(
        { ok: false, message: "Failed to start test" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "new",
      attempt: newAttempt,
      test: mockTest,
      message: "Test started successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/mock-tests/[testId]/start:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
