import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syllabusImportSchema } from "@/lib/validation/syllabus";
import { slugifyTopic } from "@/lib/syllabus/slug";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  
  // Extract courseId from body
  const { courseId, subjects } = body || {};
  
  // Validate
  const parsed = syllabusImportSchema.safeParse({ subjects });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PAYLOAD", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Create admin client
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "SERVICE_ROLE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  // Validate courseId
  let finalCourseId: string;
  if (!courseId || typeof courseId !== 'string') {
    // Fallback: try to get first active course
    const { data: defaultCourse } = await admin
      .from("courses")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!defaultCourse) {
      return NextResponse.json(
        { ok: false, error: "NO_COURSE_SELECTED", message: "Please select a course" },
        { status: 400 }
      );
    }

    // Use fallback course
    finalCourseId = defaultCourse.id;
  } else {
    finalCourseId = courseId;
  }

  const payload = parsed.data;

  for (let s = 0; s < payload.subjects.length; s++) {
    const subj = payload.subjects[s]!;
    const order = subj.order ?? s;

    const { data: subjectRow } = await admin
      .from("syllabus_subjects")
      .upsert({ name: subj.name, order, course_id: finalCourseId }, { onConflict: "name" })
      .select("id")
      .single();

    if (!subjectRow) {
      return NextResponse.json(
        { ok: false, error: "FAILED_TO_UPSERT_SUBJECT" },
        { status: 500 },
      );
    }

    for (let t = 0; t < subj.topics.length; t++) {
      const topic = subj.topics[t]!;
      const tOrder = topic.order ?? t;
      await admin.from("syllabus_topics").upsert(
        {
          subject_id: subjectRow.id,
          course_id: finalCourseId,
          name: topic.name,
          slug: slugifyTopic(topic.name),
          order: tOrder,
          is_free_preview: topic.is_free_preview ?? false,
          guardrails: topic.guardrails ?? null,
        },
        { onConflict: "subject_id,slug" },
      );
    }
  }

  await admin.from("admin_audit_logs").insert({
    admin_user_id: auth.user.id,
    action: "syllabus_imported",
    target_type: "syllabus",
    target_id: "json",
    diff_json: { subjects: payload.subjects.length },
  });

  return NextResponse.json({ ok: true });
}


