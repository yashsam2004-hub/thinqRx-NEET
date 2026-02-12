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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    // Get all enrollments WITHOUT joins (to avoid RLS recursion)
    const { data: enrollments, error } = await supabase
      .from("course_enrollments")
      .select("user_id, course_id, plan, status, created_at, valid_until")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching enrollments:", error);
      return NextResponse.json(
        { ok: false, error: "FETCH_FAILED", message: error.message, details: error },
        { status: 500 }
      );
    }

    // Get courses separately
    const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
    const { data: courses } = await supabase
      .from("courses")
      .select("id, name, code")
      .in("id", courseIds);
    
    const courseMap = new Map(courses?.map(c => [c.id, { name: c.name, code: c.code }]) || []);

    // Get unique user IDs
    const userIds = [...new Set(enrollments.map((e) => e.user_id))];
    
    // Fetch user emails and status from profiles table (faster and more reliable)
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, status")
      .in("id", userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, { email: p.email, status: p.status }]) || []);
    
    // Fetch additional user metadata from auth (names, etc.)
    const userMap = new Map<string, { email: string; name: string | null }>();
    
    for (const userId of userIds) {
      const profileEmail = profileMap.get(userId);
      
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userData?.user) {
          userMap.set(userId, {
            email: String(userData.user.email || profileEmail?.email || "Unknown"),
            name: userData.user.user_metadata?.full_name || 
                  userData.user.user_metadata?.name || null,
          });
        } else {
          // Fallback to profile email
          userMap.set(userId, { 
            email: String(profileEmail?.email || "Unknown"), 
            name: null 
          });
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        // Fallback to profile email
        userMap.set(userId, { 
          email: String(profileEmail?.email || "Unknown"), 
          name: null 
        });
      }
    }

    // Get activity stats for each user
    const { data: notesCounts, error: notesError } = await supabase
      .from("ai_notes")
      .select("user_id")
      .in("user_id", userIds);

    const { data: attemptsCounts, error: attemptsError } = await supabase
      .from("user_attempts")
      .select("user_id")
      .in("user_id", userIds);

    // Get payment information for each user (most recent successful payment)
    const { data: payments } = await supabase
      .from("payments")
      .select("user_id, amount, razorpay_payment_id, created_at, status")
      .in("user_id", userIds)
      .eq("status", "captured")
      .order("created_at", { ascending: false });

    // Map stats by user
    const notesMap = new Map<string, number>();
    const attemptsMap = new Map<string, number>();
    const paymentsMap = new Map<string, { amount: number; date: string }>();

    if (!notesError && notesCounts) {
      notesCounts.forEach((note) => {
        notesMap.set(note.user_id, (notesMap.get(note.user_id) || 0) + 1);
      });
    }

    if (!attemptsError && attemptsCounts) {
      attemptsCounts.forEach((attempt) => {
        attemptsMap.set(attempt.user_id, (attemptsMap.get(attempt.user_id) || 0) + 1);
      });
    }

    // Store most recent payment for each user
    if (payments) {
      payments.forEach((payment) => {
        if (!paymentsMap.has(payment.user_id)) {
          paymentsMap.set(payment.user_id, {
            amount: payment.amount,
            date: payment.created_at,
          });
        }
      });
    }

    // Combine data
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const user = userMap.get(enrollment.user_id);
      const course = courseMap.get(enrollment.course_id);
      const profile = profileMap.get(enrollment.user_id);
      const payment = paymentsMap.get(enrollment.user_id);

      return {
        userId: enrollment.user_id,
        email: user?.email || "Unknown",
        name: user?.name || null,
        courseName: course?.name || "Unknown",
        courseCode: course?.code || "Unknown",
        plan: enrollment.plan,
        status: enrollment.status,
        userStatus: profile?.status || "active",
        enrolledAt: enrollment.created_at,
        validUntil: enrollment.valid_until,
        totalAttempts: attemptsMap.get(enrollment.user_id) || 0,
        notesGenerated: notesMap.get(enrollment.user_id) || 0,
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
