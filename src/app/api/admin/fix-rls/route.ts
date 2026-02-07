import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/fix-rls
 * Fix RLS policies and ensure is_admin function exists
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Running RLS fix for user:", session.user.id);

    // SQL to fix RLS policies
    const fixSQL = `
      -- Recreate is_admin function
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        );
      $$;

      -- Drop existing policies
      DROP POLICY IF EXISTS mock_tests_select_published ON public.mock_tests;
      DROP POLICY IF EXISTS mock_tests_admin_all ON public.mock_tests;

      -- Recreate admin policy
      CREATE POLICY mock_tests_admin_all
      ON public.mock_tests FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );

      -- Recreate select policy for published tests
      CREATE POLICY mock_tests_select_published
      ON public.mock_tests FOR SELECT
      TO authenticated
      USING (
        status = 'published'
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });

    if (error) {
      console.error("Error executing RLS fix:", error);
      // Try alternative approach - execute statements one by one
      const statements = [
        `CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'); $$`,
      ];

      for (const stmt of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });
        if (stmtError) {
          console.error("Statement error:", stmtError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Attempted to fix RLS. Check server logs for details.",
        note: "You may need to run the migration manually via Supabase dashboard"
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "RLS policies fixed successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in fix-rls:", error);
    return NextResponse.json({ 
      error: "Unexpected error occurred", 
      details: error.message,
      note: "You may need to run the SQL migration manually via Supabase dashboard SQL editor"
    }, { status: 500 });
  }
}
