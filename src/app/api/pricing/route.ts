import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing
 * Fetch pricing for all plans (publicly accessible)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("course") || "gpat"; // Default to GPAT

    const supabase = await createSupabaseServerClient();

    // Get course ID from code
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, name, code")
      .ilike("code", courseCode)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { ok: false, error: "COURSE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get pricing for this course
    const { data: pricing, error: pricingError } = await supabase
      .from("course_pricing")
      .select("*")
      .eq("course_id", course.id)
      .order("plan", { ascending: true });

    if (pricingError) {
      return NextResponse.json(
        { ok: false, error: "PRICING_FETCH_FAILED", message: pricingError.message },
        { status: 500 }
      );
    }

    // Transform to user-friendly format
    const plans = (pricing || []).map((p) => ({
      plan: p.plan,
      monthlyPrice: p.monthly_price,
      annualPrice: p.annual_price,
      features: p.features || [],
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
    }));

    return NextResponse.json({
      ok: true,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      plans,
    });
  } catch (error) {
    console.error("GET /api/pricing error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
