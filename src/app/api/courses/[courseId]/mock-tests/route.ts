import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/courses/:courseId/mock-tests
 * Fetch all active mock tests for a course
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: tests, error } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "MOCK_TESTS_FETCH_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const transformed = tests?.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration_minutes,
      totalMarks: test.total_marks,
      questionCount: Array.isArray(test.questions) ? test.questions.length : 0,
      requiredPlan: test.required_plan,
    })) || [];

    return NextResponse.json({
      ok: true,
      tests: transformed,
    });
  } catch (error) {
    console.error("GET /api/courses/:courseId/mock-tests error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
