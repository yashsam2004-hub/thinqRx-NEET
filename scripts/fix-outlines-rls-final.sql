-- =====================================================
-- FINAL FIX: SYLLABUS_OUTLINES RLS POLICY
-- =====================================================
-- Fix for: "new row violates row-level security policy"
-- Root cause: RLS was checking JWT metadata, but API checks profiles table
-- Solution: Make RLS check profiles table (same as API)
-- =====================================================

-- Step 1: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "syllabus_outlines_select_all" ON public.syllabus_outlines;
DROP POLICY IF EXISTS "syllabus_outlines_admin_all" ON public.syllabus_outlines;

-- Step 3: Create new policies using the helper function

-- Allow all authenticated users to read outlines
CREATE POLICY "syllabus_outlines_select_all"
  ON public.syllabus_outlines
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "syllabus_outlines_admin_all"
  ON public.syllabus_outlines
  FOR ALL
  TO authenticated
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- Step 4: Verify your admin status
SELECT 
  'Your Admin Status:' as info,
  id,
  email,
  role
FROM public.profiles
WHERE id = auth.uid();

-- Step 5: If you're NOT admin, run this (replace email):
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Step 6: Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%is_user_admin%' THEN '✓ Uses profiles table'
    ELSE '✗ Old policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'syllabus_outlines'
ORDER BY policyname;
