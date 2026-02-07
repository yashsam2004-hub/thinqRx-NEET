import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateCoupon } from "@/lib/coupons/validate";
import { z } from "zod";

const reqSchema = z.object({
  code: z.string().min(1),
  courseId: z.string().uuid(),
});

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, discountPercent: 0, message: "Invalid request" },
        { status: 400 }
      );
    }

    const { code, courseId } = parsed.data;

    const validation = await validateCoupon(code, courseId, auth.user.id);

    return NextResponse.json(validation);
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { valid: false, discountPercent: 0, message: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
