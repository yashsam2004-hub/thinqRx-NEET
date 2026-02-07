import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Cache admin stats for 2 minutes
export const revalidate = 120;
export const runtime = 'nodejs';

/**
 * GET /api/admin/stats
 * Fetch admin dashboard statistics
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

    // Fetch statistics in parallel for performance
    const [
      topicsResult,
      usersResult,
      outlinesResult,
      enrollmentsResult,
      revenueResult
    ] = await Promise.all([
      // Total topics
      supabase
        .from("syllabus_topics")
        .select("*", { count: "exact", head: true }),
      
      // Total users
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      
      // Total outlines
      supabase
        .from("syllabus_outlines")
        .select("*", { count: "exact", head: true }),
      
      // Active enrollments by plan
      supabase
        .from("course_enrollments")
        .select("plan, status")
        .eq("status", "active"),
      
      // Revenue data (from course_pricing and enrollments)
      supabase
        .from("course_enrollments")
        .select(`
          plan,
          billing_cycle,
          course_id,
          courses!inner(id)
        `)
        .eq("status", "active")
        .neq("plan", "free")
    ]);

    const totalTopics = topicsResult.count || 0;
    const totalUsers = usersResult.count || 0;
    const totalOutlines = outlinesResult.count || 0;
    
    const enrollments = enrollmentsResult.data || [];
    const activeUsers = enrollments.length;
    
    // Count by plan
    const planCounts = enrollments.reduce((acc, e) => {
      acc[e.plan] = (acc[e.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate estimated revenue
    // This is a simple calculation - you'll replace this with actual payment data later
    const paidEnrollments = revenueResult.data || [];
    
    // Get pricing for calculation
    const { data: pricingData } = await supabase
      .from("course_pricing")
      .select("plan, monthly_price, annual_price");
    
    const pricingMap: Record<string, { monthly: number; annual: number }> = {};
    (pricingData || []).forEach(p => {
      pricingMap[p.plan] = {
        monthly: p.monthly_price || 0,
        annual: p.annual_price || 0
      };
    });

    // Estimate revenue (this will be replaced with actual payment tracking)
    let estimatedRevenue = 0;
    paidEnrollments.forEach(enrollment => {
      const pricing = pricingMap[enrollment.plan];
      if (pricing) {
        if (enrollment.billing_cycle === "annual") {
          estimatedRevenue += pricing.annual;
        } else {
          estimatedRevenue += pricing.monthly;
        }
      }
    });

    return NextResponse.json({
      ok: true,
      stats: {
        totalTopics,
        totalUsers,
        activeUsers,
        totalOutlines,
        estimatedRevenue,
        planBreakdown: planCounts,
        freeUsers: planCounts.free || 0,
        plusUsers: planCounts.plus || 0,
        proUsers: planCounts.pro || 0,
      }
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
