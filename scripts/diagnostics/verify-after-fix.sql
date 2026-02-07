-- ============================================
-- QUICK VERIFICATION
-- Run this after running check-and-fix-profiles.sql
-- ============================================

-- 1. Count everything
SELECT 
  'Auth Users' as type, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as type, 
  COUNT(*) as count 
FROM public.profiles
UNION ALL
SELECT 
  'Enrollments' as type, 
  COUNT(*) as count 
FROM public.course_enrollments;

-- 2. Find mismatches
SELECT 
  'Orphaned Auth (no profile)' as issue,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Orphaned Profile (no auth)' as issue,
  COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE au.id IS NULL;

-- 3. Show recent users with all data
SELECT 
  au.email,
  CASE WHEN p.id IS NOT NULL THEN '✅' ELSE '❌' END as has_profile,
  CASE WHEN ce.id IS NOT NULL THEN '✅' ELSE '❌' END as has_enrollment,
  ce.plan,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.course_enrollments ce ON ce.user_id = au.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause' 
    ELSE 'No restriction' 
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;
