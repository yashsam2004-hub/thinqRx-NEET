-- =====================================================
-- CHECK AND FIX ADMIN ACCESS
-- =====================================================
-- Run this to diagnose and fix admin access issues
-- =====================================================

-- STEP 1: Check your current user info
SELECT 
  '=== YOUR CURRENT USER INFO ===' as section,
  id,
  email,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- STEP 2: Check your profile role
SELECT 
  '=== YOUR PROFILE ROLE ===' as section,
  id,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✓ You are admin'
    ELSE '✗ You are NOT admin'
  END as status
FROM public.profiles
WHERE id = auth.uid();

-- STEP 3: Check RLS policies
SELECT 
  '=== CURRENT RLS POLICIES ===' as section,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 50) as using_clause,
  SUBSTRING(with_check::text, 1, 50) as with_check_clause
FROM pg_policies
WHERE tablename = 'syllabus_outlines'
ORDER BY policyname;

-- =====================================================
-- IF YOU'RE NOT ADMIN, UNCOMMENT AND RUN THIS:
-- =====================================================
-- 
-- -- Make yourself admin (replace with your email)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'pindiproluskiran@gmail.com';  -- ⚠️ CHANGE THIS!
-- 
-- -- Verify it worked
-- SELECT 
--   '✓ Admin role set!' as result,
--   email,
--   role
-- FROM public.profiles
-- WHERE email = 'pindiproluskiran@gmail.com';  -- ⚠️ CHANGE THIS!
--
-- =====================================================

-- STEP 4: Test if helper function exists
SELECT 
  '=== HELPER FUNCTION CHECK ===' as section,
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_user_admin';
