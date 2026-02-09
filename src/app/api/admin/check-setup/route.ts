import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/check-setup
 * Check admin setup and provide diagnostics
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      session: null,
      profile: null,
      isAdmin: false,
      mockTestsCount: 0,
      errors: [],
    };

    if (sessionError) {
      diagnostics.errors.push(`Session error: ${sessionError.message}`);
      return NextResponse.json(diagnostics);
    }

    if (!session?.user) {
      diagnostics.errors.push("No active session");
      return NextResponse.json(diagnostics);
    }

    diagnostics.session = {
      userId: session.user.id,
      email: session.user.email,
    };

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      diagnostics.errors.push(`Profile error: ${profileError.message}`);
    } else {
      diagnostics.profile = profile;
      diagnostics.isAdmin = profile?.role === "admin";
    }

    // Try to fetch mock tests
    const { data: tests, error: testsError } = await supabase
      .from("mock_tests")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false });

    if (testsError) {
      diagnostics.errors.push(`Mock tests error: ${testsError.message}`);
      if (testsError.hint) {
        diagnostics.errors.push(`Hint: ${testsError.hint}`);
      }
    } else {
      diagnostics.mockTestsCount = tests?.length || 0;
      diagnostics.mockTests = tests;
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    console.error("Error in check-setup:", error);
    return NextResponse.json({ 
      error: "Unexpected error",
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/check-setup
 * Attempt to fix admin role for current user
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    // Update user role to admin
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hint: error.hint 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin role set successfully",
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error("Error in POST check-setup:", error);
    return NextResponse.json({ 
      error: "Unexpected error",
      details: error.message 
    }, { status: 500 });
  }
}
