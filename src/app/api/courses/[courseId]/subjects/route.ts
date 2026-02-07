import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/courses/:courseId/subjects
 * Fetch all subjects for a course
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: subjects, error } = await supabase
      .from("syllabus_subjects")
      .select(`
        id,
        name,
        description,
        syllabus_topics(count)
      `)
      .eq("course_id", courseId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "SUBJECTS_FETCH_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const transformed = subjects?.map((subject) => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      topicCount: Array.isArray(subject.syllabus_topics) 
        ? subject.syllabus_topics.length 
        : 0,
    })) || [];

    return NextResponse.json({
      ok: true,
      subjects: transformed,
    });
  } catch (error) {
    console.error("GET /api/courses/:courseId/subjects error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
