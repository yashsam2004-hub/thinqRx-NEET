import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { seedSyllabus } from "@/lib/syllabus/seed";
import { slugifyTopic } from "@/lib/syllabus/slug";

export const dynamic = "force-dynamic";

export async function POST() {
  // Require authenticated admin session (RLS check via user client).
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

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "SERVICE_ROLE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  for (let s = 0; s < seedSyllabus.length; s++) {
    const subj = seedSyllabus[s]!;
    const { data: subjectRow } = await admin
      .from("syllabus_subjects")
      .upsert({ name: subj.subject, order: s }, { onConflict: "name" })
      .select("id")
      .single();
    if (!subjectRow) {
      return NextResponse.json(
        { ok: false, error: "FAILED_TO_UPSERT_SUBJECT" },
        { status: 500 },
      );
    }

    for (let t = 0; t < subj.topics.length; t++) {
      const topicName = subj.topics[t]!;
      await admin.from("syllabus_topics").upsert(
        {
          subject_id: subjectRow.id,
          name: topicName,
          slug: slugifyTopic(topicName),
          order: t,
          is_free_preview: t < 2, // small preview slice by default; admin can change later
        },
        { onConflict: "subject_id,slug" },
      );
    }
  }

  await admin.from("admin_audit_logs").insert({
    admin_user_id: auth.user.id,
    action: "syllabus_seeded",
    target_type: "syllabus",
    target_id: "v1",
    diff_json: { subjects: seedSyllabus.length },
  });

  return NextResponse.json({ ok: true });
}


