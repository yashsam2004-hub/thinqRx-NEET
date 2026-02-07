import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MockTestData } from "@/types/mock-test";

/**
 * GET /api/admin/mock-tests
 * Fetch all mock tests for admin
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { ok: false, message: "Session error", details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session found");
      return NextResponse.json(
        { ok: false, message: "Unauthorized - no session" },
        { status: 401 }
      );
    }

    console.log("Fetching profile for user:", session.user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    console.log("User profile:", profile);

    if (profile?.role !== "admin") {
      console.error("User is not admin. Role:", profile?.role);
      return NextResponse.json(
        { ok: false, message: `Admin access required. Your role: ${profile?.role || 'none'}` },
        { status: 403 }
      );
    }

    // Fetch all mock tests
    console.log("Fetching mock tests...");
    const { data: tests, error } = await supabase
      .from("mock_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mock tests:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { ok: false, message: "Failed to fetch tests", details: error.message, hint: error.hint },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${tests?.length || 0} mock tests`);

    return NextResponse.json({
      ok: true,
      tests: tests || [],
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/mock-tests:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mock-tests
 * Upload a new mock test from JSON
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { ok: false, message: "Session error", details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session found");
      return NextResponse.json(
        { ok: false, message: "Unauthorized - no session" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      console.error("User is not admin. Role:", profile?.role);
      return NextResponse.json(
        { ok: false, message: `Admin access required. Your role: ${profile?.role || 'none'}` },
        { status: 403 }
      );
    }

    // Parse the uploaded JSON
    const testData: MockTestData = await request.json();

    // SECURITY: Validate the test data structure
    const { validateMockTestData } = await import("@/lib/mock-test-validator");
    const validation = validateMockTestData(testData);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid test data",
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn("Mock test upload warnings:", validation.warnings);
    }

    // Get GPAT course (default for now)
    const { data: gpatCourse } = await supabase
      .from("courses")
      .select("id")
      .ilike("code", "gpat")
      .single();

    if (!gpatCourse) {
      return NextResponse.json(
        { ok: false, message: "GPAT course not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalQuestions = testData.questions.length;
    const totalMarks = testData.questions.reduce((sum, q) => sum + (q.marks || 4), 0);

    // Insert mock test
    const { data: newTest, error } = await supabase
      .from("mock_tests")
      .insert({
        course_id: gpatCourse.id,
        exam_type: testData.exam_name || "GPAT",
        title: testData.test_name,
        description: testData.description,
        questions_json: { questions: testData.questions }, // Only store questions array in the expected format
        total_questions: totalQuestions,
        total_marks: totalMarks,
        duration_minutes: testData.duration_minutes || 180,
        negative_marking: testData.negative_marking !== false,
        negative_marking_value: testData.negative_marking_value || -1,
        instructions: testData.instructions || [],
        status: "published", // Auto-publish for now
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting mock test:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { ok: false, message: "Failed to create test", details: error.message, hint: error.hint },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      test: newTest,
      message: "Mock test uploaded successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/mock-tests:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
