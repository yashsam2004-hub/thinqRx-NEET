import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("=== SIGNUP API CALLED ===");
  
  try {
    // SECURITY: Use centralized admin client (never expose service role to client)
    const supabaseAdmin = createSupabaseAdminClient();
    
    const body = await request.json();
    console.log("Request body:", body);
    
    const { email, password, name, courseId, plan, billingCycle } = body;

    console.log("Signup API called:", { email, courseId, plan, billingCycle });

    if (!email || !password || !courseId || !plan) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Create auth user with email verification required
    const { data: authData, error: authError} = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User must verify email
      user_metadata: {
        name: name || email,
        selected_plan: plan, // Store selected plan for payment redirect
        billing_cycle: billingCycle,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return NextResponse.json(
        { 
          ok: false, 
          error: "AUTH_FAILED",
          message: authError?.message || "Failed to create auth user"
        },
        { status: 400 }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // Step 2: Ensure profile exists (retry logic for reliability)
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
        console.log("Profile already exists (created by trigger)");
        profileCreated = true;
        break;
      }

      // Try to create profile with explicit 'student' role (NEVER admin!)
      // SECURITY: New users always get 'student' role. Admin role must be set manually in Supabase.
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          role: 'student', // EXPLICIT: Always 'student', never 'admin'
          created_at: new Date().toISOString(),
        });

      if (!profileError) {
        console.log("Profile created successfully");
        profileCreated = true;
      } else if (profileError.code === '23505') {
        // Duplicate key - profile was created by trigger
        console.log("Profile exists (race condition with trigger)");
        profileCreated = true;
      } else {
        console.error(`Profile creation attempt ${retries + 1} failed:`, profileError);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!profileCreated) {
      console.error("Failed to create profile after retries");
      return NextResponse.json(
        { 
          ok: false, 
          error: "PROFILE_CREATION_FAILED",
          message: "Failed to create user profile. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Step 3: Send welcome email with verification link
    try {
      // Generate email verification link
      const { data: verificationData, error: verificationError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
      });

      if (!verificationError && verificationData) {
        console.log('Email verification link generated for:', email);
        // Note: Supabase automatically sends the verification email
        // If you want to send custom emails, you can use the verificationData.properties.action_link
      }
    } catch (emailError) {
      console.error('Failed to generate verification link:', emailError);
      // Don't fail signup if email fails - user can request new verification email
    }

    // Step 4: Create enrollment - ONLY for FREE plan
    // PAYMENT GATE: Paid plans (plus/pro) require payment before enrollment
    
    if (plan !== "free") {
      // PAID PLAN: User account created, but enrollment requires payment
      console.log(`Paid plan selected (${plan}). Payment required before enrollment.`);
      
      return NextResponse.json({
        ok: true,
        userId: authData.user.id,
        email: email,
        requiresPayment: true,
        requiresEmailVerification: true,
        plan: plan,
        billingCycle: billingCycle,
        message: "Account created! Please check your email to verify your account, then complete payment to activate your plan.",
      });
    }

    // FREE PLAN: Create enrollment immediately
    console.log("Free plan selected. Creating enrollment...");
    
    const { data: enrollmentResult, error: enrollmentError } = await supabaseAdmin.rpc(
      'create_course_enrollment',
      {
        p_user_id: authData.user.id,
        p_course_id: courseId,
        p_plan: plan,
        p_billing_cycle: billingCycle || "monthly",
      }
    );

    if (enrollmentError) {
      console.error("Enrollment error:", enrollmentError);
      return NextResponse.json(
        { 
          ok: false, 
          error: "ENROLLMENT_FAILED",
          message: "User created but enrollment failed. Please contact support.",
          userId: authData.user.id
        },
        { status: 500 }
      );
    }

    const result = typeof enrollmentResult === 'string' 
      ? JSON.parse(enrollmentResult) 
      : enrollmentResult;

    if (!result.success) {
      console.error("Enrollment failed:", result);
      return NextResponse.json(
        { 
          ok: false, 
          error: result.error,
          message: result.message,
          userId: authData.user.id
        },
        { status: 400 }
      );
    }

    console.log("Signup completed successfully");

    return NextResponse.json({
      ok: true,
      userId: authData.user.id,
      email: email,
      enrollmentId: result.enrollment_id,
      requiresEmailVerification: true,
      message: "Account created successfully! Please check your email to verify your account before signing in.",
    });

  } catch (error: any) {
    console.error("=== SIGNUP API ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: "SERVER_ERROR",
        message: error.message || "Failed to create account",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
