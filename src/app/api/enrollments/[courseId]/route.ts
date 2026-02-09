import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserEnrollment } from "@/lib/enrollments";

export const dynamic = "force-dynamic";

/**
 * GET /api/enrollments/:courseId
 * Get user's enrollment for a specific course
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Use getSession for reliable SSR
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      // Not logged in = free access
      return NextResponse.json({
        ok: true,
        enrollment: {
          plan: "free",
          status: "active",
          validUntil: null,
        },
      });
    }

    const enrollment = await getUserEnrollment(session.user.id, courseId);

    if (!enrollment) {
      // No enrollment = free access
      return NextResponse.json({
        ok: true,
        enrollment: {
          plan: "free",
          status: "active",
          validUntil: null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      enrollment: {
        plan: enrollment.plan,
        status: enrollment.status,
        validUntil: enrollment.validUntil,
        billingCycle: enrollment.billingCycle,
      },
    });
  } catch (error) {
    console.error("GET /api/enrollments/:courseId error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
