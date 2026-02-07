import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Fetch a single mock test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", details: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch the mock test
    const { data: mockTest, error: fetchError } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("[API] Error fetching mock test:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch mock test",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!mockTest) {
      return NextResponse.json(
        { error: "Mock test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mockTest);
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a mock test
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", details: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update the mock test
    const { data: updatedTest, error: updateError } = await supabase
      .from("mock_tests")
      .update({
        exam_name: body.exam_name,
        test_name: body.test_name,
        description: body.description,
        duration_minutes: body.duration_minutes,
        negative_marking: body.negative_marking,
        negative_marking_value: body.negative_marking_value,
        instructions: body.instructions,
        is_published: body.is_published,
        plan_restriction: body.plan_restriction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[API] Error updating mock test:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update mock test",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a mock test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", details: "Admin access required" },
        { status: 403 }
      );
    }

    // Delete the mock test
    const { error: deleteError } = await supabase
      .from("mock_tests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[API] Error deleting mock test:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete mock test",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
