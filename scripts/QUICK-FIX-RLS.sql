-- =====================================================
-- 🚀 QUICK FIX: RUN THIS ENTIRE SCRIPT IN SUPABASE
-- =====================================================
-- This will fix the RLS policy issue in one go
-- =====================================================

-- 1️⃣ CREATE HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2️⃣ FIX RLS POLICIES
DROP POLICY IF EXISTS "syllabus_outlines_select_all" ON public.syllabus_outlines;
DROP POLICY IF EXISTS "syllabus_outlines_admin_all" ON public.syllabus_outlines;

CREATE POLICY "syllabus_outlines_select_all"
  ON public.syllabus_outlines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "syllabus_outlines_admin_all"
  ON public.syllabus_outlines FOR ALL
  TO authenticated
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- 3️⃣ SET YOUR ADMIN ROLE (⚠️ CHANGE THE EMAIL!)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'pindiproluskiran@gmail.com';  -- ⚠️ PUT YOUR EMAIL HERE!

-- 4️⃣ VERIFY (check the results below)
SELECT '✅ VERIFICATION RESULTS' as status;

SELECT 
  'Your role:' as check_type,
  email,
  role,
  CASE WHEN role = 'admin' THEN '✅ SUCCESS' ELSE '❌ FAILED' END as result
FROM public.profiles
WHERE id = auth.uid();

SELECT 
  'Helper function:' as check_type,
  CASE WHEN public.is_user_admin() THEN '✅ You are admin' ELSE '❌ Not admin' END as result;

SELECT 
  'Policies created:' as check_type,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ SUCCESS' ELSE '❌ FAILED' END as result
FROM pg_policies
WHERE tablename = 'syllabus_outlines';
