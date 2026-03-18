import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * API Route: Manage Syllabus Outlines
 * 
 * Endpoints:
 * - GET: Fetch outlines (all, by subject, or specific subject+topic)
 * - POST: Create or update an outline
 * - DELETE: Remove an outline
 * 
 * Admin-only access for modifications, public read access
 */

const OutlineSchema = z.object({
  course_code: z.string().min(1, "Course code is required").default("neet"),
  subject_name: z.string().min(1, "Subject name is required"),
  topic_name: z.string().optional(), // optional for subject-level default
  outline_version: z.string().optional().default("v1"),
  outline: z.array(z.string()).min(1, "Outline must have at least one section"),
  description: z.string().optional(),
  is_default: z.boolean().optional(),
});

// Helper function to check if user is admin
async function isAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  
  return profile?.role === "admin";
}

/**
 * GET: Fetch outlines
 * Query params:
 * - subject: filter by subject name
 * - topic: filter by topic name (requires subject)
 * - include_default: include default outlines (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const courseCode = searchParams.get("course_code") ?? "neet";
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const includeDefault = searchParams.get("include_default") === "true";

    let query = supabase
      .from("syllabus_outlines")
      .select("*")
      .eq("course_code", courseCode)
      .order("subject_name")
      .order("topic_name");

    if (subject) query = query.eq("subject_name", subject);
    if (topic && subject) query = query.eq("topic_name", topic);
    if (!includeDefault) query = query.eq("is_default", false);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: "OUTLINES_FETCH_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      outlines: data || [],
      count: data?.length || 0,
    });

  } catch {
    return NextResponse.json(
      { ok: false, error: "OUTLINES_FETCH_FAILED" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create or update an outline
 * Body: { subject_name, topic_name, outline, description?, is_default? }
 * 
 * Admin-only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const adminCheck = await isAdmin(supabase, user.id);
    if (!adminCheck) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = OutlineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { course_code, subject_name, topic_name, outline_version, outline, description, is_default } = parsed.data;

    const row = {
      course_code: course_code || "neet",
      subject_name,
      topic_name: (topic_name && topic_name.trim()) || "_default",
      outline_version: outline_version || "v1",
      outline,
      description: description || null,
      is_default: is_default ?? false,
      updated_at: new Date().toISOString(),
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("syllabus_outlines")
      .upsert(row, {
        onConflict: "course_code,subject_name,topic_name,outline_version",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "OUTLINE_SAVE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Outline saved successfully",
      outline: data,
    });

  } catch {
    return NextResponse.json(
      { ok: false, error: "OUTLINE_SAVE_FAILED" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove an outline
 * Query params: id (UUID of the outline to delete)
 * 
 * Admin-only
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const adminCheck = await isAdmin(supabase, user.id);
    if (!adminCheck) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID" },
        { status: 400 },
      );
    }

    // Delete the outline
    const { error } = await supabase
      .from("syllabus_outlines")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "OUTLINE_DELETE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Outline deleted successfully",
    });

  } catch {
    return NextResponse.json(
      { ok: false, error: "OUTLINE_DELETE_FAILED" },
      { status: 500 },
    );
  }
}

