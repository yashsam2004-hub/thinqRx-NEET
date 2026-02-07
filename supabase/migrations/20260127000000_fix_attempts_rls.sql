-- Fix user_attempts RLS policy to allow free-tier users without explicit enrollment
-- Date: 2026-01-27
-- Issue: Users cannot save test attempts if they don't have a course_enrollments record

-- ============================================
-- 1. UPDATE INSERT POLICY FOR user_attempts
-- ============================================

-- More permissive policy: Allow inserts if user has enrollment OR no enrollment exists (free tier)
DROP POLICY IF EXISTS "attempts_insert_own" ON public.user_attempts;
CREATE POLICY "attempts_insert_own"
ON public.user_attempts FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Allow if user has active enrollment
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = user_attempts.course_id
        AND e.status = 'active'
        AND (e.valid_until IS NULL OR e.valid_until > now())
    )
    OR
    -- OR allow if no enrollment record exists (implies free tier access)
    NOT EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = user_attempts.course_id
    )
  )
);

COMMENT ON POLICY "attempts_insert_own" ON public.user_attempts IS 
  'Users can insert test attempts if they have active enrollment OR no enrollment (free tier)';

-- ============================================
-- 2. BACKFILL MISSING FREE ENROLLMENTS
-- ============================================

-- Create free enrollments for users who have attempts but no enrollment
INSERT INTO public.course_enrollments (
  user_id,
  course_id,
  plan,
  status,
  valid_until
)
SELECT DISTINCT
  ua.user_id,
  ua.course_id,
  'free' as plan,
  'active' as status,
  NULL::timestamptz as valid_until
FROM public.user_attempts ua
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_enrollments e
  WHERE e.user_id = ua.user_id
    AND e.course_id = ua.course_id
)
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ============================================
-- 3. VERIFICATION
-- ============================================

DO $$
DECLARE
  v_attempts_count int;
  v_users_with_attempts int;
  v_users_with_enrollments int;
BEGIN
  -- Count total attempts
  SELECT COUNT(*) INTO v_attempts_count FROM public.user_attempts;
  
  -- Count unique users with attempts
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_attempts FROM public.user_attempts;
  
  -- Count users with enrollments
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_enrollments FROM public.course_enrollments;
  
  RAISE NOTICE 'Total attempts: %', v_attempts_count;
  RAISE NOTICE 'Users with attempts: %', v_users_with_attempts;
  RAISE NOTICE 'Users with enrollments: %', v_users_with_enrollments;
  
  IF v_users_with_attempts <= v_users_with_enrollments THEN
    RAISE NOTICE '✅ All users with attempts now have enrollments';
  ELSE
    RAISE WARNING '⚠️ Some users with attempts still missing enrollments';
  END IF;
END $$;
