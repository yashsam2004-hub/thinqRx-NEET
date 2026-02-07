import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for profile updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update profile using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ name })
      .eq("id", userId)
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { 
          ok: false, 
          error: "PROFILE_UPDATE_FAILED",
          message: profileError.message,
          details: profileError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: "SERVER_ERROR",
        message: error.message || "Failed to update profile"
      },
      { status: 500 }
    );
  }
}
