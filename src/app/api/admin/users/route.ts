import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Fetch all users with their roles
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { ok: false, message: "Session error", details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile || profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all users with their profiles (email column contains the email)
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at, status")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch users", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      users: users || [],
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user role
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile || profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get request body
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { ok: false, message: "userId and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "student"].includes(role)) {
      return NextResponse.json(
        { ok: false, message: "Role must be 'admin' or 'student'" },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === session.user.id && role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "Cannot remove your own admin access" },
        { status: 400 }
      );
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to update user role", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      message: `User role updated to ${role}`,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/admin/users:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
