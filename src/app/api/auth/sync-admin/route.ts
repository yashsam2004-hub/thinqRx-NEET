import { NextResponse } from "next/server";
import { getAdminAllowlist } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = data.user;
  const email = (user.email ?? "").toLowerCase();
  const allowlist = getAdminAllowlist();

  if (allowlist.length === 0 || !allowlist.includes(email)) {
    return NextResponse.json({ ok: true, synced: false });
  }

  const admin = createSupabaseAdminClient();

  // Fetch current role for audit diff.
  const { data: existing } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const previousRole = existing?.role ?? "student";

  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      role: "admin",
    },
    { onConflict: "id" },
  );

  if (previousRole !== "admin") {
    await admin.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action: "admin_role_granted",
      target_type: "profiles",
      target_id: user.id,
      diff_json: {
        from: previousRole,
        to: "admin",
        reason: "allowlist",
      },
    });
  }

  return NextResponse.json({ ok: true, synced: true });
}


