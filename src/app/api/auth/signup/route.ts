import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("[Signup] API called");

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const body = await request.json();
    const { email, password, name } = body;

    console.log("[Signup] Request:", { email });

    // ✅ Validate input
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Step 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
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
          message: authError?.message || "Failed to create user",
        },
        { status: 400 }
      );
    }

    console.log("[Signup] Auth user created:", authData.user.id);

    // ✅ Step 2: Create profile (with retry logic)
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
        console.error(
          `[Signup] Profile attempt ${retries + 1} failed:`,
          profileError
        );
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (!profileCreated) {
      console.error("[Signup] Failed to create profile");
      return NextResponse.json(
        {
          ok: false,
          error: "PROFILE_CREATION_FAILED",
          message: "Failed to create profile",
        },
        { status: 500 }
      );
    }

    // ✅ FINAL SUCCESS (NO ENROLLMENT HERE)
    console.log("[Signup] Complete:", authData.user.id);

    return NextResponse.json({
      ok: true,
      userId: authData.user.id,
      email: email,
      message: "Account created successfully! You can now sign in.",
    });

  } catch (error: any) {
    console.error("[Signup] Server error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "SERVER_ERROR",
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}