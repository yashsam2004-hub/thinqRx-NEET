import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();

  // Check auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    // Fetch attempt
    const { data: attempt, error } = await supabase
      .from("user_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", auth.user.id) // Ensure user owns this attempt
      .single();

    if (error || !attempt) {
      return NextResponse.json(
        { ok: false, error: "ATTEMPT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Parse responses_json
    const responsesData = attempt.responses_json as any;

    return NextResponse.json({
      ok: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        timeTaken: attempt.time_taken_seconds,
        responses: responsesData?.responses || [],
        metadata: responsesData?.metadata || {},
      },
    });
  } catch (error: any) {
    console.error("Error fetching attempt:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
