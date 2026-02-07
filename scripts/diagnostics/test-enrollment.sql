-- Quick Test: Create Enrollment
-- Run this in Supabase SQL Editor to test enrollment creation

-- ============================================
-- 1. Check current data
-- ============================================

-- View all courses
SELECT id, code, name, is_active FROM courses;

-- View all profiles (last 5) - check what columns exist first
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;

-- View all enrollments
SELECT 
  ce.id,
  ce.user_id,
  p.email,
  c.code as course,
  ce.plan,
  ce.status,
  ce.created_at
FROM course_enrollments ce
JOIN profiles p ON p.id = ce.user_id
JOIN courses c ON c.id = ce.course_id
ORDER BY ce.created_at DESC;

-- ============================================
-- 2. Test enrollment function
-- ============================================

-- Get the GPAT course ID:
SELECT id, code FROM courses WHERE code = 'GPAT' LIMIT 1;

-- Get a user ID that doesn't have an enrollment yet:
SELECT p.id, p.email 
FROM profiles p
LEFT JOIN course_enrollments ce ON ce.user_id = p.id
WHERE ce.id IS NULL
LIMIT 5;

-- Test the function (replace UUIDs with actual values from above):
-- SELECT create_course_enrollment(
--   'USER_ID_HERE'::UUID,
--   'COURSE_ID_HERE'::UUID,
--   'free',
--   'monthly'
-- );

-- ============================================
-- 3. Check RLS Policies
-- ============================================

-- View all RLS policies on course_enrollments
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'course_enrollments';

-- ============================================
-- 4. Check if RLS is enabled
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'course_enrollments', 'courses');

-- ============================================
-- 5. Temporary fix: Disable RLS for testing
-- ============================================

-- ONLY USE THIS FOR TESTING! Re-enable after testing!
-- ALTER TABLE course_enrollments DISABLE ROW LEVEL SECURITY;

-- To re-enable:
-- ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
