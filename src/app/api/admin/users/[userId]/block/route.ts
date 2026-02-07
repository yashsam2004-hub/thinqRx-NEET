import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/users/[userId]/block
 * Block or unblock a user
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
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

    // Get action from body
    const body = await request.json();
    const { action } = body; // "block" or "unblock"

    if (!action || !["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ACTION", message: "Action must be 'block' or 'unblock'" },
        { status: 400 }
      );
    }

    // Prevent admin from blocking themselves
    if (userId === user.id) {
      return NextResponse.json(
        { ok: false, error: "CANNOT_BLOCK_SELF", message: "You cannot block yourself" },
        { status: 400 }
      );
    }

    // Use admin client to update user status
    const supabaseAdmin = createSupabaseAdminClient();
    
    const newStatus = action === "block" ? "blocked" : "active";
    
    const { data: updatedProfile, error } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId)
      .select("id, email, status")
      .single();

    if (error) {
      console.error("Failed to update user status:", error);
      return NextResponse.json(
        { ok: false, error: "UPDATE_FAILED", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
      message: action === "block" 
        ? "User blocked successfully" 
        : "User unblocked successfully",
    });
  } catch (error: any) {
    console.error("Admin block user error:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
