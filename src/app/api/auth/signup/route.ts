import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("[Signup] API called");

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const body = await request.json();
    const { email, password, name, courseId } = body;

    console.log("[Signup] Request:", { email, courseId });

    if (!email || !password || !courseId) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // CRITICAL: All new users register as FREE. Upgrades happen after login via /upgrade page.
    const plan = "free";

    // Step 1: Create auth user with email auto-confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email,
      },
    });

    if (authError || !authData.user) {
      console.error("[Signup] Auth creation error:", authError);
      return NextResponse.json(
        {
          ok: false,
          error: "AUTH_FAILED",
          message: authError?.message || "Failed to create auth user",
        },
        { status: 400 }
      );
    }

    console.log("[Signup] Auth user created:", authData.user.id);

    // Step 2: Ensure profile exists
    let profileCreated = false;
    let retries = 0;
    const maxRetries = 3;

    while (!profileCreated && retries < maxRetries) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", authData.user.id)
        .single();

      if (existingProfile) {
        console.log("[Signup] Profile already exists");
        profileCreated = true;
        break;
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          role: "student",
          created_at: new Date().toISOString(),
        });

      if (!profileError) {
        console.log("[Signup] Profile created");
        profileCreated = true;
      } else if (profileError.code === "23505") {
        console.log("[Signup] Profile exists (race condition)");
        profileCreated = true;
      } else {
        console.error(`[Signup] Profile attempt ${retries + 1} failed:`, profileError);
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (!profileCreated) {
      console.error("[Signup] Failed to create profile after retries");
      return NextResponse.json(
        {
          ok: false,
          error: "PROFILE_CREATION_FAILED",
          message: "Failed to create user profile. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Step 3: Create FREE enrollment immediately
    console.log("[Signup] Creating free enrollment...");

    const { data: enrollmentResult, error: enrollmentError } = await supabaseAdmin.rpc(
      "create_course_enrollment",
      {
        p_user_id: authData.user.id,
        p_course_id: courseId,
        p_plan: plan,
        p_billing_cycle: "monthly",
      }
    );

    if (enrollmentError) {
      console.error("[Signup] Enrollment error:", enrollmentError);
      return NextResponse.json(
        {
          ok: false,
          error: "ENROLLMENT_FAILED",
          message: "User created but enrollment failed. Please contact support.",
          userId: authData.user.id,
        },
        { status: 500 }
      );
    }

    const result =
      typeof enrollmentResult === "string" ? JSON.parse(enrollmentResult) : enrollmentResult;

    if (!result.success) {
      console.error("[Signup] Enrollment failed:", result);
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          message: result.message,
          userId: authData.user.id,
        },
        { status: 400 }
      );
    }

    console.log("[Signup] Complete - free account created:", authData.user.id);

    return NextResponse.json({
      ok: true,
      userId: authData.user.id,
      email: email,
      enrollmentId: result.enrollment_id,
      requiresEmailVerification: false,
      message: "Account created successfully! You can now sign in.",
    });
  } catch (error: any) {
    console.error("[Signup] Error:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: "SERVER_ERROR",
        message: error.message || "Failed to create account",
      },
      { status: 500 }
    );
  }
}
