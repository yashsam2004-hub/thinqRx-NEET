import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountPercent: z.number().min(1).max(50),
  courseId: z.string().uuid().nullable(),
  maxUses: z.number().min(1).max(1000),
  expiresAt: z.string().datetime().nullable(),
});

/**
 * GET /api/admin/coupons
 * Fetch all coupons
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
      .from("coupons")
      .select("*, courses(name, code)")
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: coupons, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { ok: false, error: "COUPONS_FETCH_FAILED", message: fetchError.message },
        { status: 500 }
      );
    }

    const transformed = coupons?.map((c) => ({
      id: c.id,
      code: c.code,
      discountPercent: c.discount_percent,
      courseId: c.course_id,
      courseName: (c.courses as { name?: string })?.name || "All Courses",
      maxUses: c.max_uses,
      usedCount: c.used_count,
      isActive: c.is_active,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
    })) || [];

    return NextResponse.json({ ok: true, coupons: transformed });
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
export async function POST(request: Request) {
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
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, discountPercent, courseId, maxUses, expiresAt } = parsed.data;

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        code,
        discount_percent: discountPercent,
        course_id: courseId,
        max_uses: maxUses,
        expires_at: expiresAt,
        is_active: true,
        used_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "COUPON_CREATE_FAILED", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        courseId: coupon.course_id,
        maxUses: coupon.max_uses,
        usedCount: coupon.used_count,
        isActive: coupon.is_active,
        expiresAt: coupon.expires_at,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/coupons
 * Update coupon (toggle active status or update details)
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
    const updateSchema = z.object({
      id: z.string().uuid(),
      isActive: z.boolean(),
    });

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const { id, isActive } = parsed.data;

    const { error } = await supabase
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "COUPON_UPDATE_FAILED", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/coupons error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons
 * Delete a coupon
 */
export async function DELETE(request: Request) {
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
    const couponId = searchParams.get("id");

    if (!couponId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_COUPON_ID" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "COUPON_DELETE_FAILED", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
