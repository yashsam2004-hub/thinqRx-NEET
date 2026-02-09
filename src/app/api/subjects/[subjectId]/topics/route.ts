import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/subjects/:subjectId/topics
 * Fetch all topics for a subject
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: topics, error } = await supabase
      .from("syllabus_topics")
      .select("id, name, description, is_free_preview")
      .eq("subject_id", subjectId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "TOPICS_FETCH_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const transformed = topics?.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      isFreePreview: topic.is_free_preview,
    })) || [];

    return NextResponse.json({
      ok: true,
      topics: transformed,
    });
  } catch (error) {
    console.error("GET /api/subjects/:subjectId/topics error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
