import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Check 1: Environment variables
    diagnostics.checks.envVars = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      diagnostics.checks.envVars.error = "SUPABASE_SERVICE_ROLE_KEY is missing!";
      return NextResponse.json(diagnostics);
    }

    // Create admin client
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

    // Check 2: Can we connect to database?
    try {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from("courses")
        .select("id, code")
        .limit(1);

      diagnostics.checks.databaseConnection = {
        success: !coursesError,
        courses: courses?.length || 0,
        error: coursesError?.message
      };
    } catch (e: any) {
      diagnostics.checks.databaseConnection = {
        success: false,
        error: e.message
      };
    }

    // Check 3: Does the stored procedure exist?
    try {
      const { data, error } = await supabaseAdmin.rpc('create_course_enrollment', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_course_id: '00000000-0000-0000-0000-000000000000',
        p_plan: 'test',
        p_billing_cycle: 'monthly'
      });

      diagnostics.checks.storedProcedure = {
        exists: true,
        testResult: data,
        error: error?.message
      };
    } catch (e: any) {
      diagnostics.checks.storedProcedure = {
        exists: false,
        error: e.message
      };
    }

    // Check 4: Can we query profiles?
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1);

      diagnostics.checks.profilesTable = {
        success: !profilesError,
        count: profiles?.length || 0,
        error: profilesError?.message
      };
    } catch (e: any) {
      diagnostics.checks.profilesTable = {
        success: false,
        error: e.message
      };
    }

    // Check 5: Can we query course_enrollments?
    try {
      const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
        .from("course_enrollments")
        .select("id")
        .limit(1);

      diagnostics.checks.enrollmentsTable = {
        success: !enrollmentsError,
        count: enrollments?.length || 0,
        error: enrollmentsError?.message
      };
    } catch (e: any) {
      diagnostics.checks.enrollmentsTable = {
        success: false,
        error: e.message
      };
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    diagnostics.error = error.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
