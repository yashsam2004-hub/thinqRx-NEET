import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments
 * Fetch all payments for admin dashboard
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Use admin client to fetch all payments (bypassing RLS for admin)
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        enrollment:enrollment_id (
          plan,
          billing_cycle,
          course_id,
          courses (name, code)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch payments:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    // Fetch user details for each payment
    const userIds = [...new Set(payments.map(p => p.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Enrich payments with user email
    const enrichedPayments = payments.map(payment => ({
      ...payment,
      userEmail: profileMap.get(payment.user_id)?.email || "Unknown",
    }));

    // Calculate stats
    const totalRevenue = payments
      .filter(p => p.payment_status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const pendingRevenue = payments
      .filter(p => p.payment_status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const stats = {
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.payment_status === "completed").length,
      pendingPayments: payments.filter(p => p.payment_status === "pending").length,
      failedPayments: payments.filter(p => p.payment_status === "failed").length,
      totalRevenue,
      pendingRevenue,
    };

    return NextResponse.json({
      ok: true,
      payments: enrichedPayments,
      stats,
    });
  } catch (error: any) {
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments
 * Manually create a payment record (for manual/offline payments)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, enrollmentId, amount, plan, billingCycle, notes, paymentMethod } = body;

    if (!userId || !amount || !plan) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        enrollment_id: enrollmentId,
        amount,
        plan,
        billing_cycle: billingCycle || "monthly",
        payment_status: "completed", // Manual payments are marked as completed
        payment_method: paymentMethod || "manual",
        notes,
        currency: "INR",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create payment:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to create payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      payment,
      message: "Payment recorded successfully",
    });
  } catch (error: any) {
    console.error("Admin create payment error:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
