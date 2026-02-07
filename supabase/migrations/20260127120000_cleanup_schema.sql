-- Schema Cleanup and Optimization
-- Date: 2026-01-27
-- Purpose: Remove unnecessary tables and optimize schema for production

-- ============================================
-- 1. DROP UNUSED TABLES
-- ============================================

-- Drop old subscription system (replaced with course_enrollments)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Drop user_entitlements (replaced with course_enrollments)
DROP TABLE IF EXISTS public.user_entitlements CASCADE;

-- Drop analytics_events (not used in current implementation)
DROP TABLE IF EXISTS public.analytics_events CASCADE;

-- Drop user_bookmarks (feature not implemented)
DROP TABLE IF EXISTS public.user_bookmarks CASCADE;

-- Drop question_bank (using mock_questions instead)
DROP TABLE IF EXISTS public.question_bank CASCADE;

-- Drop admin_audit_logs (not currently used)
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;

-- Drop coupons (not currently used)
DROP TABLE IF EXISTS public.coupons CASCADE;

-- Drop payments (not integrated yet)
DROP TABLE IF EXISTS public.payments CASCADE;

-- Drop cms tables (not used)
DROP TABLE IF EXISTS public.cms_assets CASCADE;
DROP TABLE IF EXISTS public.cms_pages CASCADE;

-- Drop syllabus_outlines (not currently used)
DROP TABLE IF EXISTS public.syllabus_outlines CASCADE;

-- Drop ai_tests (using user_attempts instead)
DROP TABLE IF EXISTS public.ai_tests CASCADE;

-- ============================================
-- 2. OPTIMIZE REMAINING TABLES
-- ============================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_course 
ON public.user_attempts(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_attempts_created 
ON public.user_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_notes_user_topic 
ON public.ai_notes(user_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user 
ON public.course_enrollments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_mock_questions_test 
ON public.mock_questions(test_id, "order");

-- ============================================
-- 3. ADD MISSING CONSTRAINTS
-- ============================================

-- Ensure course_enrollments has proper constraints
ALTER TABLE public.course_enrollments
  DROP CONSTRAINT IF EXISTS course_enrollments_plan_check,
  ADD CONSTRAINT course_enrollments_plan_check 
    CHECK (plan IN ('free', 'plus', 'pro'));

ALTER TABLE public.course_enrollments
  DROP CONSTRAINT IF EXISTS course_enrollments_status_check,
  ADD CONSTRAINT course_enrollments_status_check 
    CHECK (status IN ('active', 'expired', 'cancelled'));

-- Ensure mock_tests has proper constraints
ALTER TABLE public.mock_tests
  DROP CONSTRAINT IF EXISTS mock_tests_type_check,
  ADD CONSTRAINT mock_tests_type_check 
    CHECK (type IN ('mock', 'grand'));

-- ============================================
-- 4. UPDATE TABLE COMMENTS
-- ============================================

COMMENT ON TABLE public.courses IS 'Available courses (GPAT, NIPER, etc.)';
COMMENT ON TABLE public.course_enrollments IS 'User course enrollments with plan information';
COMMENT ON TABLE public.profiles IS 'User profiles mirroring auth.users';
COMMENT ON TABLE public.syllabus_subjects IS 'Exam syllabus subjects';
COMMENT ON TABLE public.syllabus_topics IS 'Topics within subjects';
COMMENT ON TABLE public.ai_notes IS 'AI-generated study notes for topics';
COMMENT ON TABLE public.mock_tests IS 'Admin-created mock tests';
COMMENT ON TABLE public.mock_questions IS 'Questions for mock tests';
COMMENT ON TABLE public.user_attempts IS 'User test attempts and scores';
COMMENT ON TABLE public.course_pricing IS 'Pricing plans for courses';

-- ============================================
-- 5. ENSURE GPAT COURSE EXISTS
-- ============================================

-- Insert GPAT course if it doesn't exist
INSERT INTO public.courses (code, name, description, is_active)
VALUES (
  'gpat',
  'GPAT Preparation',
  'Graduate Pharmacy Aptitude Test preparation course',
  true
)
ON CONFLICT (code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- ============================================
-- 6. ENSURE DEFAULT PRICING EXISTS
-- ============================================

-- Get GPAT course ID
DO $$
DECLARE
  gpat_course_id uuid;
BEGIN
  SELECT id INTO gpat_course_id
  FROM public.courses
  WHERE code = 'gpat';

  -- Insert Free plan pricing
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price)
  VALUES (gpat_course_id, 'free', 0, 0)
  ON CONFLICT (course_id, plan) 
  DO UPDATE SET
    monthly_price = 0,
    annual_price = 0;

  -- Insert Pro plan pricing
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price)
  VALUES (gpat_course_id, 'pro', 499, 1999)
  ON CONFLICT (course_id, plan) 
  DO UPDATE SET
    monthly_price = 499,
    annual_price = 1999;
END $$;

-- ============================================
-- 7. CLEAN UP ORPHANED DATA
-- ============================================

-- Remove user_attempts without valid course_id
DELETE FROM public.user_attempts
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- Remove ai_notes without valid topic_id
DELETE FROM public.ai_notes
WHERE topic_id NOT IN (SELECT id FROM public.syllabus_topics);

-- Remove mock_questions without valid test_id
DELETE FROM public.mock_questions
WHERE test_id NOT IN (SELECT id FROM public.mock_tests);

-- ============================================
-- 8. VACUUM AND ANALYZE
-- ============================================

VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.courses;
VACUUM ANALYZE public.course_enrollments;
VACUUM ANALYZE public.user_attempts;
VACUUM ANALYZE public.ai_notes;
VACUUM ANALYZE public.mock_tests;
VACUUM ANALYZE public.mock_questions;

-- ============================================
-- 9. VERIFICATION
-- ============================================

DO $$
DECLARE
  v_tables text[];
  v_table text;
BEGIN
  -- List all remaining tables
  SELECT array_agg(tablename) INTO v_tables
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  
  RAISE NOTICE 'Remaining tables in public schema:';
  FOREACH v_table IN ARRAY v_tables LOOP
    RAISE NOTICE '  - %', v_table;
  END LOOP;
  
  RAISE NOTICE '✅ Schema cleanup complete!';
END $$;
