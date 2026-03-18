import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint to check analytics data
 * Only available in development
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const user = session.user;

    // Get NEET course
    const { data: neetCourse } = await supabase
      .from("courses")
      .select("*")
      .ilike("code", "neet")
      .single();

    const courseId = neetCourse?.id;

    // Get user plan
    const userPlan = courseId ? await getUserPlan(user.id, courseId) : null;

    // Get enrollment
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId || "")
      .single();

    // Get ALL attempts
    const { data: allAttempts } = await supabase
      .from("user_attempts")
      .select("*")
      .eq("user_id", user.id);

    // Get NEET attempts
    const { data: neetAttempts } = await supabase
      .from("user_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId || "");

    // Get topics for attempts
    const topicIds = Array.from(
      new Set(
        (allAttempts || [])
          .filter((a) => a.kind === "ai_topic" && a.source_id)
          .map((a) => a.source_id)
      )
    );

    const { data: topics } = await supabase
      .from("syllabus_topics")
      .select("id, name, course_id, syllabus_subjects(name)")
      .in("id", topicIds);

    return NextResponse.json({
      ok: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
        },
        course: neetCourse,
        courseId,
        enrollment: enrollment || null,
        userPlan,
        attempts: {
          total: allAttempts?.length || 0,
          neetOnly: neetAttempts?.length || 0,
          byKind: {
            ai_topic: allAttempts?.filter((a) => a.kind === "ai_topic").length || 0,
            mock_test: allAttempts?.filter((a) => a.kind === "mock_test").length || 0,
          },
        },
        recentAttempts: allAttempts?.slice(-5) || [],
        topics: topics || [],
        topicsByCourse: topics?.reduce((acc: any, t: any) => {
          acc[t.course_id] = (acc[t.course_id] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
