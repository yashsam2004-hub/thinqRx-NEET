import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const pricingSchema = z.object({
  courseId: z.string().uuid(),
  plan: z.enum(["free", "plus", "pro"]),
  monthlyPrice: z.number().min(0),
  annualPrice: z.number().min(0),
  validityDays: z.number().nullable().optional(),
  features: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
});

// Cache pricing data for 5 minutes
export const revalidate = 300;

/**
 * GET /api/admin/pricing
 * Fetch all pricing for all courses
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    let query = supabase
      .from("course_pricing")
      .select("*, courses(name, code)")
      .order("created_at", { ascending: true });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: pricing, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: "PRICING_FETCH_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const transformed = pricing?.map((p) => ({
      id: p.id,
      courseId: p.course_id,
      courseName: (p.courses as { name?: string })?.name || "Unknown",
      courseCode: (p.courses as { code?: string })?.code || "",
      plan: p.plan,
      monthlyPrice: p.monthly_price,
      annualPrice: p.annual_price,
      validityDays: p.validity_days,
      features: p.features || [],
      limitations: p.limitations || [],
    })) || [];

    return NextResponse.json({ ok: true, pricing: transformed });
  } catch (error) {
    console.error("GET /api/admin/pricing error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing
 * Update pricing for a course/plan
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = pricingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId, plan, monthlyPrice, annualPrice, validityDays, features, limitations } = parsed.data;

    // SECURITY: Use admin client to bypass RLS for admin operations
    const supabaseAdmin = createSupabaseAdminClient();
    
    const { data: pricing, error } = await supabaseAdmin
      .from("course_pricing")
      .upsert(
        {
          course_id: courseId,
          plan,
          monthly_price: monthlyPrice,
          annual_price: annualPrice,
          validity_days: validityDays,
          features: features || [],
          limitations: limitations || [],
        },
        { onConflict: "course_id,plan" }
      )
      .select()
      .single();

    if (error) {
      console.error("Pricing update error:", error);
      return NextResponse.json(
        { ok: false, error: "PRICING_UPDATE_FAILED", message: error.message },
        { status: 500 }
      );
    }

    // IMPORTANT: Revalidate the pricing page so it shows updated prices immediately
    try {
      revalidatePath("/pricing");
      console.log("Pricing page revalidated successfully");
    } catch (revalidateError) {
      console.error("Failed to revalidate pricing page:", revalidateError);
    }

    return NextResponse.json({
      ok: true,
      pricing: {
        id: pricing.id,
        courseId: pricing.course_id,
        plan: pricing.plan,
        monthlyPrice: pricing.monthly_price,
        annualPrice: pricing.annual_price,
        validityDays: pricing.validity_days,
        features: pricing.features,
        limitations: pricing.limitations,
      },
      message: "Pricing updated successfully. Public pricing page will refresh shortly.",
    });
  } catch (error) {
    console.error("PUT /api/admin/pricing error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
