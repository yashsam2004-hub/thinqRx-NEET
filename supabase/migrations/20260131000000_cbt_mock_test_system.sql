-- ============================================
-- CBT-Style Mock Test System
-- Date: 2026-01-31
-- Purpose: Full Computer-Based Test experience
-- ============================================

-- ============================================
-- 1. EXTEND mock_tests TABLE
-- ============================================

-- Add columns for CBT features
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'GPAT' CHECK (exam_type IN ('GPAT', 'NIPER', 'PHARMACIST', 'OTHER')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS questions_json JSONB NOT NULL DEFAULT '{"questions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS total_questions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_marks INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_marking BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS negative_marking_value DECIMAL(3,2) DEFAULT -0.25,
  ADD COLUMN IF NOT EXISTS instructions TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop old columns that are replaced
ALTER TABLE public.mock_tests
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS question_count,
  DROP COLUMN IF EXISTS published;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mock_tests_course ON public.mock_tests(course_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_status ON public.mock_tests(status);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam_type ON public.mock_tests(exam_type);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_mock_tests_updated_at ON public.mock_tests;
CREATE TRIGGER trg_mock_tests_updated_at
BEFORE UPDATE ON public.mock_tests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 2. CREATE mock_test_attempts TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.mock_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Test session data
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  
  -- Responses (JSONB array of QuestionResponse)
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Scores
  score INT NOT NULL DEFAULT 0,
  max_score INT NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
  
  -- Metadata (subject performance, counts, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Session state for resume (question states, current index, time remaining)
  session_state JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_active_attempt UNIQUE NULLS NOT DISTINCT (user_id, mock_test_id, 
    CASE WHEN status = 'in_progress' THEN 1 ELSE NULL END)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_user ON public.mock_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_test ON public.mock_test_attempts(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_status ON public.mock_test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_user_test ON public.mock_test_attempts(user_id, mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_created ON public.mock_test_attempts(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER trg_mock_test_attempts_updated_at
BEFORE UPDATE ON public.mock_test_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 3. UPDATE user_attempts TABLE
-- ============================================

-- Add columns for mock test integration
ALTER TABLE public.user_attempts
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS max_score INT;

-- Add index for course_id
CREATE INDEX IF NOT EXISTS idx_user_attempts_course ON public.user_attempts(course_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_mock_test ON public.user_attempts(mock_test_id);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- mock_tests: Published tests readable by all authenticated users
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY mock_tests_select_published
ON public.mock_tests FOR SELECT
TO authenticated
USING (status = 'published');

CREATE POLICY mock_tests_admin_all
ON public.mock_tests FOR ALL
TO authenticated
USING (public.is_admin());

-- mock_test_attempts: Users can only access their own attempts
ALTER TABLE public.mock_test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY mock_test_attempts_select_own
ON public.mock_test_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY mock_test_attempts_insert_own
ON public.mock_test_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY mock_test_attempts_update_own
ON public.mock_test_attempts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY mock_test_attempts_admin_all
ON public.mock_test_attempts FOR ALL
TO authenticated
USING (public.is_admin());

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get active attempt for a test
CREATE OR REPLACE FUNCTION public.get_active_mock_test_attempt(
  p_user_id UUID,
  p_mock_test_id UUID
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM public.mock_test_attempts
  WHERE user_id = p_user_id
    AND mock_test_id = p_mock_test_id
    AND status = 'in_progress'
  LIMIT 1;
$$;

-- Function to calculate subject-wise performance
CREATE OR REPLACE FUNCTION public.calculate_subject_performance(
  p_responses JSONB,
  p_questions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_question JSONB;
  v_response JSONB;
  v_subject TEXT;
  v_subjects JSONB := '{}'::jsonb;
  v_subject_data JSONB;
BEGIN
  -- Loop through questions and responses to calculate per-subject stats
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions->'questions')
  LOOP
    v_subject := v_question->>'subject';
    
    -- Get corresponding response
    SELECT * INTO v_response
    FROM jsonb_array_elements(p_responses)
    WHERE (value->>'question_id') = (v_question->>'question_id');
    
    -- Initialize subject if not exists
    IF NOT (v_subjects ? v_subject) THEN
      v_subjects := v_subjects || jsonb_build_object(
        v_subject,
        jsonb_build_object(
          'total', 0,
          'correct', 0,
          'incorrect', 0,
          'skipped', 0,
          'time_spent', 0
        )
      );
    END IF;
    
    -- Update counts
    v_subject_data := v_subjects->v_subject;
    v_subject_data := v_subject_data || jsonb_build_object('total', (v_subject_data->>'total')::int + 1);
    
    IF v_response IS NULL OR v_response->>'selected_option' IS NULL THEN
      v_subject_data := v_subject_data || jsonb_build_object('skipped', (v_subject_data->>'skipped')::int + 1);
    ELSIF (v_response->>'selected_option') = (v_question->>'correct_option') THEN
      v_subject_data := v_subject_data || jsonb_build_object('correct', (v_subject_data->>'correct')::int + 1);
    ELSE
      v_subject_data := v_subject_data || jsonb_build_object('incorrect', (v_subject_data->>'incorrect')::int + 1);
    END IF;
    
    IF v_response IS NOT NULL THEN
      v_subject_data := v_subject_data || jsonb_build_object(
        'time_spent',
        (v_subject_data->>'time_spent')::int + COALESCE((v_response->>'time_spent_seconds')::int, 0)
      );
    END IF;
    
    v_subjects := v_subjects || jsonb_build_object(v_subject, v_subject_data);
  END LOOP;
  
  -- Convert to array format
  SELECT jsonb_agg(
    jsonb_build_object(
      'subject', key,
      'total_questions', (value->>'total')::int,
      'correct', (value->>'correct')::int,
      'incorrect', (value->>'incorrect')::int,
      'skipped', (value->>'skipped')::int,
      'accuracy', 
        CASE 
          WHEN ((value->>'correct')::int + (value->>'incorrect')::int) > 0
          THEN ROUND(((value->>'correct')::int::decimal / ((value->>'correct')::int + (value->>'incorrect')::int)) * 100, 2)
          ELSE 0
        END,
      'time_spent_seconds', (value->>'time_spent')::int
    )
  ) INTO v_result
  FROM jsonb_each(v_subjects);
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.mock_tests IS 'CBT-style mock tests with full question data';
COMMENT ON TABLE public.mock_test_attempts IS 'User attempts for mock tests with session state';
COMMENT ON COLUMN public.mock_tests.questions_json IS 'Full test data including questions, options, answers';
COMMENT ON COLUMN public.mock_test_attempts.responses IS 'Array of user responses with timing data';
COMMENT ON COLUMN public.mock_test_attempts.session_state IS 'Current test session state for resume functionality';
COMMENT ON COLUMN public.mock_test_attempts.metadata IS 'Calculated performance metrics and breakdowns';

-- ============================================
-- 7. MIGRATE EXISTING DATA
-- ============================================

-- Set course_id for existing mock tests (assuming GPAT)
UPDATE public.mock_tests
SET course_id = (SELECT id FROM public.courses WHERE code = 'gpat' LIMIT 1)
WHERE course_id IS NULL;

-- Update existing user_attempts with course_id
UPDATE public.user_attempts ua
SET course_id = (SELECT id FROM public.courses WHERE code = 'gpat' LIMIT 1)
WHERE ua.course_id IS NULL;

-- ============================================
-- 8. VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ CBT Mock Test System migration complete!';
  RAISE NOTICE 'Tables created/updated:';
  RAISE NOTICE '  - mock_tests (extended with CBT features)';
  RAISE NOTICE '  - mock_test_attempts (new)';
  RAISE NOTICE '  - user_attempts (extended)';
  RAISE NOTICE 'RLS policies and helper functions added.';
END $$;
