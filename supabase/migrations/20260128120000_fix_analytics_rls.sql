-- Fix Analytics RLS Policies
-- Date: 2026-01-28
-- Purpose: Ensure user_attempts are properly saved and retrieved

-- ============================================
-- 1. DROP EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "attempts_insert_own" ON public.user_attempts;
DROP POLICY IF EXISTS "attempts_read_own" ON public.user_attempts;
DROP POLICY IF EXISTS "attempts_read_admin" ON public.user_attempts;

-- ============================================
-- 2. CREATE PERMISSIVE INSERT POLICY
-- ============================================

-- Allow ALL authenticated users to insert their own attempts
-- No enrollment check on insert (creates better UX)
CREATE POLICY "attempts_insert_own"
ON public.user_attempts FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

COMMENT ON POLICY "attempts_insert_own" ON public.user_attempts IS 
  'All authenticated users can insert their own test attempts';

-- ============================================
-- 3. CREATE PERMISSIVE READ POLICY
-- ============================================

-- Allow users to read their own attempts
CREATE POLICY "attempts_read_own"
ON public.user_attempts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

COMMENT ON POLICY "attempts_read_own" ON public.user_attempts IS 
  'Users can read their own test attempts';

-- ============================================
-- 4. CREATE ADMIN READ POLICY
-- ============================================

-- Allow admins to read all attempts
-- Check if admin role exists in user metadata
CREATE POLICY "attempts_read_admin"
ON public.user_attempts FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

COMMENT ON POLICY "attempts_read_admin" ON public.user_attempts IS 
  'Admins can read all test attempts';

-- ============================================
-- 5. ENSURE FREE ENROLLMENTS EXIST
-- ============================================

-- Create free enrollments for ALL authenticated users who don't have one
-- This ensures getUserPlan() returns a valid plan
INSERT INTO public.course_enrollments (
  user_id,
  course_id,
  plan,
  status,
  valid_until
)
SELECT
  p.id as user_id,
  c.id as course_id,
  'free' as plan,
  'active' as status,
  NULL::timestamptz as valid_until
FROM public.profiles p
CROSS JOIN public.courses c
WHERE c.code ILIKE 'gpat'
  AND NOT EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = p.id
      AND e.course_id = c.id
  )
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ============================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_course 
  ON public.user_attempts(user_id, course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_attempts_kind 
  ON public.user_attempts(user_id, kind, created_at DESC);

-- ============================================
-- 7. VERIFICATION
-- ============================================

DO $$
DECLARE
  v_total_users int;
  v_users_with_enrollment int;
  v_total_attempts int;
  v_users_with_attempts int;
  v_gpat_course_id uuid;
BEGIN
  -- Get GPAT course ID
  SELECT id INTO v_gpat_course_id FROM public.courses WHERE code ILIKE 'gpat';
  
  -- Count users
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  
  -- Count users with GPAT enrollment
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_enrollment 
  FROM public.course_enrollments 
  WHERE course_id = v_gpat_course_id;
  
  -- Count attempts
  SELECT COUNT(*) INTO v_total_attempts FROM public.user_attempts;
  
  -- Count users with attempts
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_attempts FROM public.user_attempts;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Analytics RLS Fix - Verification Results';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Users with GPAT enrollment: %', v_users_with_enrollment;
  RAISE NOTICE 'Total test attempts: %', v_total_attempts;
  RAISE NOTICE 'Users with attempts: %', v_users_with_attempts;
  RAISE NOTICE '===========================================';
  
  IF v_users_with_enrollment >= v_total_users THEN
    RAISE NOTICE '✅ All users have GPAT enrollment';
  ELSE
    RAISE WARNING '⚠️ % users missing GPAT enrollment', v_total_users - v_users_with_enrollment;
  END IF;
  
  IF v_total_attempts > 0 THEN
    RAISE NOTICE '✅ Test attempts exist in database';
  ELSE
    RAISE WARNING '⚠️ No test attempts found';
  END IF;
END $$;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Ensure authenticated users have necessary permissions
GRANT SELECT, INSERT ON public.user_attempts TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.syllabus_topics TO authenticated;
GRANT SELECT ON public.syllabus_subjects TO authenticated;
GRANT SELECT ON public.course_enrollments TO authenticated;

-- ============================================
-- DONE
-- ============================================

COMMENT ON TABLE public.user_attempts IS 
  'Stores all user test attempts (practice tests and mock tests) with responses and scores';
