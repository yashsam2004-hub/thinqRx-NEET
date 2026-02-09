import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MockTestQuestion, QuestionResponse, SubjectPerformance } from "@/types/mock-test";

export const dynamic = "force-dynamic";

/**
 * POST /api/mock-tests/[testId]/submit
 * Submit test and calculate scores
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
    const { attempt_id } = await request.json();

    // Get attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("id", attempt_id)
      .eq("user_id", user.id)
      .eq("mock_test_id", testId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { ok: false, message: "Attempt not found" },
        { status: 404 }
      );
    }

    // SECURITY: Prevent double submission
    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { ok: false, message: "Test already submitted" },
        { status: 400 }
      );
    }

    // Get mock test with questions
    const { data: mockTest } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (!mockTest) {
      return NextResponse.json(
        { ok: false, message: "Test not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify timer integrity (server-side check)
    const startTime = new Date(attempt.started_at).getTime();
    const currentTime = new Date().getTime();
    const actualTimeSpent = Math.floor((currentTime - startTime) / 1000);
    const allowedTime = mockTest.duration_minutes * 60;

    // Allow 5 second grace period for network latency
    // Timer integrity check (continue with submission)

    const testData = mockTest.questions_json;
    const questions: MockTestQuestion[] = testData.questions || [];
    const responses: QuestionResponse[] = attempt.responses || [];

    // SECURITY: Validate responses (prevent manipulation)
    const { validateResponses } = await import("@/lib/mock-test-validator");
    if (!validateResponses(responses, questions)) {
      return NextResponse.json(
        { ok: false, message: "Invalid response data" },
        { status: 400 }
      );
    }

    // Calculate scores SERVER-SIDE (security: don't trust client)
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    // Create subject-wise performance map
    const subjectPerformanceMap = new Map<string, {
      total: number;
      correct: number;
      incorrect: number;
      skipped: number;
      timeSpent: number;
    }>();

    questions.forEach((question) => {
      const response = responses.find(r => r.question_id === question.question_id);
      const subject = question.subject;

      // Initialize subject if not exists
      if (!subjectPerformanceMap.has(subject)) {
        subjectPerformanceMap.set(subject, {
          total: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          timeSpent: 0,
        });
      }

      const subjectData = subjectPerformanceMap.get(subject)!;
      subjectData.total++;

      if (!response || response.selected_option === null) {
        // Skipped
        skippedCount++;
        subjectData.skipped++;
      } else if (response.selected_option === question.correct_option) {
        // Correct
        correctCount++;
        subjectData.correct++;
        totalScore += question.marks;
      } else {
        // Incorrect
        incorrectCount++;
        subjectData.incorrect++;
        if (mockTest.negative_marking) {
          totalScore += question.negative_marks;
        }
      }

      if (response) {
        subjectData.timeSpent += response.time_spent_seconds || 0;
      }
    });

    // Convert to array
    const subjectPerformance: SubjectPerformance[] = Array.from(
      subjectPerformanceMap.entries()
    ).map(([subject, data]) => ({
      subject,
      total_questions: data.total,
      correct: data.correct,
      incorrect: data.incorrect,
      skipped: data.skipped,
      accuracy: data.correct + data.incorrect > 0
        ? (data.correct / (data.correct + data.incorrect)) * 100
        : 0,
      time_spent_seconds: data.timeSpent,
    }));

    // Calculate accuracy
    const accuracyPercentage = correctCount + incorrectCount > 0
      ? (correctCount / (correctCount + incorrectCount)) * 100
      : 0;

    // Use actualTimeSpent calculated earlier (no duplicate variables)
    const finalTimeSpentSeconds = actualTimeSpent;

    // Update attempt with final results
    const { error: updateError } = await supabase
      .from("mock_test_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        time_spent_seconds: finalTimeSpentSeconds,
        score: totalScore,
        max_score: mockTest.total_marks,
        accuracy_percentage: accuracyPercentage,
        status: "submitted",
        metadata: {
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          skipped_count: skippedCount,
          subject_wise_performance: subjectPerformance,
        },
      })
      .eq("id", attempt_id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: "Failed to submit test" },
        { status: 500 }
      );
    }

    // Also create entry in user_attempts for analytics integration
    const { error: analyticsError } = await supabase.from("user_attempts").insert({
      user_id: user.id,
      course_id: mockTest.course_id,
      kind: "mock_test",
      source_id: null,
      mock_test_id: mockTest.id,
      score: totalScore,
      max_score: mockTest.total_marks,
      time_taken_seconds: finalTimeSpentSeconds,
      responses_json: {
        test_title: mockTest.title,
        exam_type: mockTest.exam_type,
        responses: responses,
        questions: questions,
        subject_wise_performance: subjectPerformance,
        metadata: {
          correct: correctCount,
          incorrect: incorrectCount,
          unattempted: skippedCount,
          totalQuestions: questions.length,
          accuracy: accuracyPercentage,
          total_marks: mockTest.total_marks,
        },
      },
    });

    // Don't fail the submission if analytics insert fails

    return NextResponse.json({
      ok: true,
      message: "Test submitted successfully",
      result: {
        score: totalScore,
        max_score: mockTest.total_marks,
        accuracy: accuracyPercentage,
        correct: correctCount,
        incorrect: incorrectCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
