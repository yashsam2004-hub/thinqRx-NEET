import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/debug/me
 * Debug endpoint to check current user and role
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || "Not logged in",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", auth.user.id)
      .maybeSingle();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: profile?.role || "none",
        isAdmin: profile?.role === "admin",
      },
      profile: profile || null,
      profileError: profileError?.message,
    });
  } catch (error) {
    console.error("GET /api/debug/me error:", error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
