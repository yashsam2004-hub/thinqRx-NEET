
-- Update RLS Policies to be Course-Aware
-- Phase 1.3: Course-specific access control

-- ============================================
-- 1. UPDATE SYLLABUS_SUBJECTS POLICIES
-- ============================================

-- Everyone can view subjects for active courses
DROP POLICY IF EXISTS "syllabus_subjects_select_all" ON public.syllabus_subjects;
CREATE POLICY "syllabus_subjects_select_all"
ON public.syllabus_subjects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = syllabus_subjects.course_id
      AND c.is_active = true
  )
);

-- Admin can manage all subjects
DROP POLICY IF EXISTS "syllabus_subjects_write_admin" ON public.syllabus_subjects;
CREATE POLICY "syllabus_subjects_write_admin"
ON public.syllabus_subjects FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- 2. UPDATE SYLLABUS_TOPICS POLICIES
-- ============================================

-- Users can view topics based on their plan and course enrollment
DROP POLICY IF EXISTS "syllabus_topics_select_all" ON public.syllabus_topics;
CREATE POLICY "syllabus_topics_select_all"
ON public.syllabus_topics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = syllabus_topics.course_id
      AND c.is_active = true
  )
  AND (
    -- Free preview topics are visible to everyone
    syllabus_topics.is_free_preview = true
    OR
    -- Or user has valid enrollment
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = syllabus_topics.course_id
        AND e.status = 'active'
        AND (e.valid_until IS NULL OR e.valid_until > now())
        AND e.plan IN ('plus', 'pro')
    )
    OR
    -- Or user is admin
    public.is_admin()
  )
);

-- Admin can manage all topics
DROP POLICY IF EXISTS "syllabus_topics_write_admin" ON public.syllabus_topics;
CREATE POLICY "syllabus_topics_write_admin"
ON public.syllabus_topics FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- 3. UPDATE AI_NOTES POLICIES
-- ============================================

-- Users can view their own notes or admin can view all, course-aware
DROP POLICY IF EXISTS "ai_notes_select_own_or_admin" ON public.ai_notes;
CREATE POLICY "ai_notes_select_own_or_admin"
ON public.ai_notes FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

-- Users can insert notes for courses they're enrolled in
DROP POLICY IF EXISTS "ai_notes_insert_own" ON public.ai_notes;
CREATE POLICY "ai_notes_insert_own"
ON public.ai_notes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = ai_notes.course_id
      AND e.status = 'active'
      AND (e.valid_until IS NULL OR e.valid_until > now())
  )
);

-- ============================================
-- 4. UPDATE AI_TESTS POLICIES
-- ============================================

-- Users can view their own tests or admin can view all
DROP POLICY IF EXISTS "ai_tests_select_own_or_admin" ON public.ai_tests;
CREATE POLICY "ai_tests_select_own_or_admin"
ON public.ai_tests FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

-- Users can insert tests for courses they're enrolled in
DROP POLICY IF EXISTS "ai_tests_insert_own" ON public.ai_tests;
CREATE POLICY "ai_tests_insert_own"
ON public.ai_tests FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = ai_tests.course_id
      AND e.status = 'active'
      AND (e.valid_until IS NULL OR e.valid_until > now())
  )
);

-- ============================================
-- 5. UPDATE MOCK_TESTS POLICIES
-- ============================================

-- Users can view published mock tests for courses they have access to
DROP POLICY IF EXISTS "mock_tests_select_published_or_admin" ON public.mock_tests;
CREATE POLICY "mock_tests_select_published_or_admin"
ON public.mock_tests FOR SELECT
USING (
  (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = mock_tests.course_id
        AND c.is_active = true
    )
    AND (
      -- Free users can see but not take tests
      EXISTS (
        SELECT 1 FROM public.course_enrollments e
        WHERE e.user_id = auth.uid()
          AND e.course_id = mock_tests.course_id
          AND e.status = 'active'
          AND (e.valid_until IS NULL OR e.valid_until > now())
      )
      OR public.is_admin()
    )
  )
  OR public.is_admin()
);

-- ============================================
-- 6. UPDATE USER_ATTEMPTS POLICIES
-- ============================================

-- Users can view their own attempts for courses they're enrolled in
DROP POLICY IF EXISTS "attempts_select_own_or_admin" ON public.user_attempts;
CREATE POLICY "attempts_select_own_or_admin"
ON public.user_attempts FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

-- Users can insert attempts for courses they're enrolled in
DROP POLICY IF EXISTS "attempts_insert_own" ON public.user_attempts;
CREATE POLICY "attempts_insert_own"
ON public.user_attempts FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = user_attempts.course_id
      AND e.status = 'active'
      AND (e.valid_until IS NULL OR e.valid_until > now())
  )
);

-- ============================================
-- 7. UPDATE SYLLABUS_OUTLINES POLICY (if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'syllabus_outlines') THEN
    -- Add course_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'syllabus_outlines' AND column_name = 'course_id'
    ) THEN
      ALTER TABLE public.syllabus_outlines 
        ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS syllabus_outlines_course_id_idx 
        ON public.syllabus_outlines(course_id);
    END IF;

    -- Update existing outlines to GPAT course
    UPDATE public.syllabus_outlines
    SET course_id = (SELECT id FROM public.courses WHERE code = 'gpat' LIMIT 1)
    WHERE course_id IS NULL;

    -- Update policy
    EXECUTE 'DROP POLICY IF EXISTS "syllabus_outlines_select_all" ON public.syllabus_outlines';
    EXECUTE 'CREATE POLICY "syllabus_outlines_select_all"
             ON public.syllabus_outlines FOR SELECT
             USING (true)';
  END IF;
END $$;

-- ============================================
-- 8. ADD COURSE ACCESS CHECK VIEWS (OPTIONAL)
-- ============================================

-- Create a view for easy enrollment checking
CREATE OR REPLACE VIEW public.user_course_access AS
SELECT 
  e.user_id,
  e.course_id,
  c.code as course_code,
  c.name as course_name,
  e.plan,
  e.status,
  e.valid_until,
  CASE 
    WHEN e.status = 'active' AND (e.valid_until IS NULL OR e.valid_until > now()) THEN true
    ELSE false
  END as has_access,
  CASE e.plan
    WHEN 'free' THEN 0
    WHEN 'plus' THEN 1
    WHEN 'pro' THEN 2
    ELSE 0
  END as plan_level
FROM public.course_enrollments e
JOIN public.courses c ON c.id = e.course_id;

COMMENT ON VIEW public.user_course_access IS 'Easy access to user enrollment status per course';

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Verify that all existing data has course_id set
DO $$
DECLARE
  v_subjects_without_course int;
  v_topics_without_course int;
  v_notes_without_course int;
BEGIN
  SELECT COUNT(*) INTO v_subjects_without_course 
  FROM public.syllabus_subjects WHERE course_id IS NULL;
  
  SELECT COUNT(*) INTO v_topics_without_course 
  FROM public.syllabus_topics WHERE course_id IS NULL;
  
  SELECT COUNT(*) INTO v_notes_without_course 
  FROM public.ai_notes WHERE course_id IS NULL;

  IF v_subjects_without_course > 0 THEN
    RAISE WARNING 'Found % subjects without course_id', v_subjects_without_course;
  END IF;

  IF v_topics_without_course > 0 THEN
    RAISE WARNING 'Found % topics without course_id', v_topics_without_course;
  END IF;

  IF v_notes_without_course > 0 THEN
    RAISE WARNING 'Found % notes without course_id', v_notes_without_course;
  END IF;

  IF v_subjects_without_course = 0 AND v_topics_without_course = 0 AND v_notes_without_course = 0 THEN
    RAISE NOTICE 'All existing data successfully migrated to course system';
  END IF;
END $$;
