import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // SECURITY: Use centralized admin client (never expose service role to client)
    const supabaseAdmin = createSupabaseAdminClient();
    
    const { userId, courseId, plan, billingCycle } = await request.json();

    console.log("Enrollment API called:", { userId, courseId, plan, billingCycle });

    if (!userId || !courseId || !plan) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set!");
      return NextResponse.json(
        { 
          ok: false, 
          error: "SERVER_CONFIG_ERROR",
          message: "Server configuration error. Please contact administrator.",
          details: "Service role key not configured"
        },
        { status: 500 }
      );
    }

    // Try stored procedure first, fallback to direct insert if it fails
    console.log("Creating enrollment using stored procedure:", { userId, courseId, plan, billingCycle });

    let enrollment: any;

    try {
      const { data, error } = await supabaseAdmin.rpc('create_course_enrollment', {
        p_user_id: userId,
        p_course_id: courseId,
        p_plan: plan,
        p_billing_cycle: billingCycle || "monthly"
      });

      console.log("Stored procedure result:", { data, error });

      if (error) {
        console.error("Stored procedure error, trying direct insert:", error);
        throw new Error("Stored procedure failed");
      }

      // Parse the result from stored procedure
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result.success) {
        console.error("Enrollment failed:", result);
        
        if (result.error === "USER_ALREADY_ENROLLED") {
          return NextResponse.json(
            { 
              ok: false, 
              error: result.error,
              message: result.message
            },
            { status: 409 }
          );
        }
        
        throw new Error(result.message || "Enrollment failed");
      }

      enrollment = {
        id: result.enrollment_id,
        user_id: userId,
        course_id: courseId,
        plan: plan,
        billing_cycle: billingCycle || "monthly"
      };

      console.log("Enrollment created successfully via stored procedure");

    } catch (rpcError: any) {
      console.log("Falling back to direct insert...");

      // Fallback: Direct insert with service role
      // VALIDITY: All paid plans (plus/pro) have 365 days validity
      // Free plan has lifetime access (null)
      const validUntil = plan === "free" 
        ? null 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 365 days for all paid plans

      const { data: enrollmentData, error: insertError } = await supabaseAdmin
        .from("course_enrollments")
        .insert({
          user_id: userId,
          course_id: courseId,
          plan: plan,
          billing_cycle: billingCycle || "monthly",
          status: "active",
          valid_until: validUntil,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Direct insert also failed:", insertError);
        return NextResponse.json(
          { 
            ok: false, 
            error: "ENROLLMENT_FAILED",
            message: insertError.message,
            details: insertError
          },
          { status: 500 }
        );
      }

      enrollment = enrollmentData;
      console.log("Enrollment created successfully via direct insert");
    }

    return NextResponse.json({
      ok: true,
      enrollment,
      message: "Enrollment created successfully",
    });
  } catch (error: any) {
    console.error("Enrollment API error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: "SERVER_ERROR",
        message: error.message || "Failed to create enrollment"
      },
      { status: 500 }
    );
  }
}
