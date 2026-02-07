-- =====================================================
-- FIX RLS POLICY FOR SYLLABUS_OUTLINES
-- =====================================================
-- Fix for: "new row violates row-level security policy"
-- The policy needs WITH CHECK clause for INSERT/UPDATE
-- =====================================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "syllabus_outlines_admin_all" ON public.syllabus_outlines;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "syllabus_outlines_admin_all"
  ON public.syllabus_outlines
  FOR ALL
  TO authenticated
  USING (
    -- Allow access if user is admin
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    -- Allow creation/modification if user is admin
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'syllabus_outlines'
ORDER BY policyname;

-- Verify your admin role
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data->>'role' as app_meta_role
FROM auth.users
WHERE id = auth.uid();
