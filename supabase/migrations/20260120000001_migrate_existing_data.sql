-- Migrate Existing Data to Multi-Course System
-- Phase 1.2: Seed GPAT course and migrate existing data

-- ============================================
-- 1. INSERT GPAT/NIPER COURSE
-- ============================================

INSERT INTO public.courses (code, name, description, is_active, is_coming_soon)
VALUES (
  'gpat',
  'GPAT / NIPER',
  'Graduate Pharmacy Aptitude Test preparation - comprehensive study material, practice tests, and mock exams',
  true,
  false
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    is_coming_soon = EXCLUDED.is_coming_soon;

-- Store GPAT course ID for later use
DO $$
DECLARE
  v_gpat_course_id uuid;
BEGIN
  -- Get GPAT course ID
  SELECT id INTO v_gpat_course_id
  FROM public.courses
  WHERE code = 'gpat';

  -- ============================================
  -- 2. SET DEFAULT PRICING FOR GPAT
  -- ============================================

  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES
    (v_gpat_course_id, 'free', 0, 0, 
     '["Limited topic access", "5 AI notes/day", "Basic practice tests", "View mock tests"]'::jsonb),
    (v_gpat_course_id, 'plus', 199, 1910,
     '["Full topic access", "20 AI notes/day", "Unlimited practice tests", "All mock tests", "Performance analytics"]'::jsonb),
    (v_gpat_course_id, 'pro', 499, 4790,
     '["Everything in Plus", "Unlimited AI notes", "Priority support", "Advanced analytics", "Doubt solving", "Study plans"]'::jsonb)
  ON CONFLICT (course_id, plan) DO UPDATE
  SET monthly_price = EXCLUDED.monthly_price,
      annual_price = EXCLUDED.annual_price,
      features = EXCLUDED.features;

  -- ============================================
  -- 3. MIGRATE EXISTING SYLLABUS TO GPAT COURSE
  -- ============================================

  -- Update syllabus_subjects
  UPDATE public.syllabus_subjects
  SET course_id = v_gpat_course_id
  WHERE course_id IS NULL;

  -- Update syllabus_topics (set course_id from their subject's course_id)
  UPDATE public.syllabus_topics t
  SET course_id = s.course_id
  FROM public.syllabus_subjects s
  WHERE t.subject_id = s.id
    AND t.course_id IS NULL;

  -- ============================================
  -- 4. MIGRATE EXISTING AI NOTES TO GPAT COURSE
  -- ============================================

  UPDATE public.ai_notes n
  SET course_id = v_gpat_course_id
  WHERE course_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.syllabus_topics t
      WHERE t.id = n.topic_id AND t.course_id = v_gpat_course_id
    );

  -- ============================================
  -- 5. MIGRATE EXISTING AI TESTS TO GPAT COURSE
  -- ============================================

  UPDATE public.ai_tests t
  SET course_id = v_gpat_course_id
  WHERE course_id IS NULL;

  -- ============================================
  -- 6. MIGRATE EXISTING MOCK TESTS TO GPAT COURSE
  -- ============================================

  UPDATE public.mock_tests
  SET course_id = v_gpat_course_id
  WHERE course_id IS NULL;

  -- ============================================
  -- 7. MIGRATE EXISTING USER ATTEMPTS TO GPAT COURSE
  -- ============================================

  UPDATE public.user_attempts
  SET course_id = v_gpat_course_id
  WHERE course_id IS NULL;

  -- ============================================
  -- 8. CREATE FREE ENROLLMENTS FOR EXISTING USERS
  -- ============================================

  -- Give all existing users free access to GPAT course
  INSERT INTO public.course_enrollments (user_id, course_id, plan, status)
  SELECT DISTINCT
    u.id,
    v_gpat_course_id,
    'free',
    'active'
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = u.id AND e.course_id = v_gpat_course_id
  )
  ON CONFLICT (user_id, course_id) DO NOTHING;

END $$;

-- ============================================
-- 9. INSERT COMING SOON COURSES
-- ============================================

INSERT INTO public.courses (code, name, description, is_active, is_coming_soon)
VALUES
  ('neet-pg', 'NEET-PG', 'National Eligibility cum Entrance Test - Postgraduate Medical', false, true),
  ('neet-mds', 'NEET-MDS', 'National Eligibility cum Entrance Test - Master of Dental Surgery', false, true),
  ('gate-life-sci', 'GATE Life Sciences', 'Graduate Aptitude Test in Engineering - Life Sciences', false, true),
  ('gate-biotech', 'GATE Biotechnology', 'Graduate Aptitude Test in Engineering - Biotechnology', false, true),
  ('csir-net', 'CSIR-UGC NET', 'Council of Scientific & Industrial Research - Life Sciences', false, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 10. VERIFICATION
-- ============================================

-- Verify migration
DO $$
DECLARE
  v_courses_count int;
  v_gpat_subjects_count int;
  v_gpat_topics_count int;
  v_gpat_enrollments_count int;
BEGIN
  SELECT COUNT(*) INTO v_courses_count FROM public.courses;
  SELECT COUNT(*) INTO v_gpat_subjects_count FROM public.syllabus_subjects WHERE course_id IS NOT NULL;
  SELECT COUNT(*) INTO v_gpat_topics_count FROM public.syllabus_topics WHERE course_id IS NOT NULL;
  SELECT COUNT(*) INTO v_gpat_enrollments_count FROM public.course_enrollments;

  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Courses created: %', v_courses_count;
  RAISE NOTICE '  GPAT subjects migrated: %', v_gpat_subjects_count;
  RAISE NOTICE '  GPAT topics migrated: %', v_gpat_topics_count;
  RAISE NOTICE '  User enrollments created: %', v_gpat_enrollments_count;
END $$;
