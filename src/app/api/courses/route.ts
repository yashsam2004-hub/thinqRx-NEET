import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/courses
 * Fetch all active courses (GPAT-only)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "COURSES_FETCH_FAILED", message: error.message },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedCourses = (courses ?? []).map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      isActive: course.is_active,
      isComingSoon: course.is_coming_soon ?? false,
      createdAt: course.created_at,
    }));

    return NextResponse.json({
      ok: true,
      courses: transformedCourses,
    });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
