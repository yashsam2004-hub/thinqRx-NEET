import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Create admin client for user fetching
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

export async function GET() {
  const supabase = await createSupabaseServerClient();
  
  // Check auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Check admin role
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    // 1. Get ALL profiles (this is the source of truth for registered users)
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, status, subscription_plan, subscription_status, subscription_end_date, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { ok: false, error: "FETCH_FAILED", message: profilesError.message },
        { status: 500 }
      );
    }

    // 2. Get all enrollments
    const { data: enrollments } = await supabaseAdmin
      .from("course_enrollments")
      .select("user_id, course_id, plan, status, created_at, valid_until")
      .order("created_at", { ascending: false });

    // 3. Get courses
    const courseIds = [...new Set((enrollments || []).map((e) => e.course_id))];
    const { data: courses } = courseIds.length > 0
      ? await supabaseAdmin.from("courses").select("id, name, code").in("id", courseIds)
      : { data: [] };
    
    const courseMap = new Map(courses?.map(c => [c.id, { name: c.name, code: c.code }]) || []);

    // 4. Build enrollment map (user_id -> best enrollment)
    const enrollmentMap = new Map<string, typeof enrollments extends (infer T)[] | null ? T : never>();
    (enrollments || []).forEach((e) => {
      const existing = enrollmentMap.get(e.user_id);
      // Keep the most recent or active enrollment
      if (!existing || e.status === "active" || new Date(e.created_at) > new Date(existing.created_at)) {
        enrollmentMap.set(e.user_id, e);
      }
    });

    // 5. Get all user IDs
    const allUserIds = allProfiles.map(p => p.id);

    // 6. Fetch auth metadata (names) for all users
    const userMetaMap = new Map<string, { email: string; name: string | null }>();
    for (const userId of allUserIds) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user) {
          userMetaMap.set(userId, {
            email: String(userData.user.email || "Unknown"),
            name: userData.user.user_metadata?.full_name || 
                  userData.user.user_metadata?.name || null,
          });
        }
      } catch (err) {
        // Fallback — profile email already available
      }
    }

    // 7. Get activity stats
    const { data: notesCounts } = allUserIds.length > 0
      ? await supabaseAdmin.from("ai_notes").select("user_id").in("user_id", allUserIds)
      : { data: [] };

    const { data: attemptsCounts } = allUserIds.length > 0
      ? await supabaseAdmin.from("user_attempts").select("user_id").in("user_id", allUserIds)
      : { data: [] };

    // 8. Get payment info (most recent completed payment per user)
    const { data: payments } = allUserIds.length > 0
      ? await supabaseAdmin
          .from("payments")
          .select("user_id, amount, created_at, status")
          .in("user_id", allUserIds)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
      : { data: [] };

    // Build maps
    const notesMap = new Map<string, number>();
    (notesCounts || []).forEach((n) => {
      notesMap.set(n.user_id, (notesMap.get(n.user_id) || 0) + 1);
    });

    const attemptsMap = new Map<string, number>();
    (attemptsCounts || []).forEach((a) => {
      attemptsMap.set(a.user_id, (attemptsMap.get(a.user_id) || 0) + 1);
    });

    const paymentsMap = new Map<string, { amount: number; date: string }>();
    (payments || []).forEach((p) => {
      if (!paymentsMap.has(p.user_id)) {
        paymentsMap.set(p.user_id, { amount: p.amount, date: p.created_at });
      }
    });

    // 9. Build enriched list — one row per user (using best enrollment if exists)
    const enrichedEnrollments = allProfiles.map((profile) => {
      const authMeta = userMetaMap.get(profile.id);
      const enrollment = enrollmentMap.get(profile.id);
      const course = enrollment ? courseMap.get(enrollment.course_id) : null;
      const payment = paymentsMap.get(profile.id);

      // Determine plan: from enrollment if exists, else from profile, else "free"
      const plan = enrollment?.plan || profile.subscription_plan || "free";
      const status = enrollment?.status || (profile.subscription_status === "active" ? "active" : "registered");

      return {
        userId: profile.id,
        email: authMeta?.email || profile.email || "Unknown",
        name: authMeta?.name || null,
        courseName: course?.name || (enrollment ? "Unknown" : "—"),
        courseCode: course?.code || (enrollment ? "Unknown" : "—"),
        plan,
        status,
        userStatus: profile.status || "active",
        enrolledAt: enrollment?.created_at || profile.created_at,
        validUntil: enrollment?.valid_until || profile.subscription_end_date || null,
        totalAttempts: attemptsMap.get(profile.id) || 0,
        notesGenerated: notesMap.get(profile.id) || 0,
        paymentAmount: payment?.amount || null,
        paymentDate: payment?.date || null,
      };
    });

    return NextResponse.json({
      ok: true,
      enrollments: enrichedEnrollments,
    });
  } catch (error: any) {
    console.error("Error in users/enrollments API:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
