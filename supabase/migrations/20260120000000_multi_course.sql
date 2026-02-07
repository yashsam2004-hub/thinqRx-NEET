-- Multi-Course Platform Schema
-- Phase 1: Database Foundation & Course Architecture

-- ============================================
-- 1. COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_coming_soon boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. COURSE ENROLLMENTS (User ↔ Course)
-- ============================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'plus', 'pro')),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  valid_until timestamptz,
  razorpay_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS course_enrollments_user_id_idx ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS course_enrollments_course_id_idx ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS course_enrollments_status_idx ON public.course_enrollments(status);

-- ============================================
-- 3. COURSE PRICING
-- ============================================
CREATE TABLE IF NOT EXISTS public.course_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'plus', 'pro')),
  monthly_price int NOT NULL DEFAULT 0,
  annual_price int NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, plan)
);

CREATE INDEX IF NOT EXISTS course_pricing_course_id_idx ON public.course_pricing(course_id);

-- ============================================
-- 4. COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 50),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  max_uses int DEFAULT 20,
  used_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);
CREATE INDEX IF NOT EXISTS coupons_course_id_idx ON public.coupons(course_id);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON public.coupons(is_active);

-- ============================================
-- 5. ADD course_id TO EXISTING TABLES
-- ============================================

-- Add course_id to syllabus_subjects
ALTER TABLE public.syllabus_subjects 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS syllabus_subjects_course_id_idx ON public.syllabus_subjects(course_id);

-- Add course_id to syllabus_topics (through subject relationship, but add for direct queries)
ALTER TABLE public.syllabus_topics 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS syllabus_topics_course_id_idx ON public.syllabus_topics(course_id);

-- Add course_id to ai_notes
ALTER TABLE public.ai_notes 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ai_notes_course_id_idx ON public.ai_notes(course_id);

-- Add course_id to ai_tests
ALTER TABLE public.ai_tests 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ai_tests_course_id_idx ON public.ai_tests(course_id);

-- Update mock_tests to include course_id
ALTER TABLE public.mock_tests 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS mock_tests_course_id_idx ON public.mock_tests(course_id);

-- Add course_id to user_attempts
ALTER TABLE public.user_attempts 
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_attempts_course_id_idx ON public.user_attempts(course_id);

-- ============================================
-- 6. UPDATE TRIGGERS FOR NEW TABLES
-- ============================================

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_course_enrollments_updated_at ON public.course_enrollments;
CREATE TRIGGER trg_course_enrollments_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_course_pricing_updated_at ON public.course_pricing;
CREATE TRIGGER trg_course_pricing_updated_at
BEFORE UPDATE ON public.course_pricing
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES FOR NEW TABLES
-- ============================================

-- Courses: Everyone can view active courses, only admin can manage
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
CREATE POLICY "courses_select_all"
ON public.courses FOR SELECT
USING (true);

DROP POLICY IF EXISTS "courses_write_admin" ON public.courses;
CREATE POLICY "courses_write_admin"
ON public.courses FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Course Enrollments: Users can view their own, admin can view all
DROP POLICY IF EXISTS "enrollments_select_own_or_admin" ON public.course_enrollments;
CREATE POLICY "enrollments_select_own_or_admin"
ON public.course_enrollments FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "enrollments_insert_own" ON public.course_enrollments;
CREATE POLICY "enrollments_insert_own"
ON public.course_enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_update_admin" ON public.course_enrollments;
CREATE POLICY "enrollments_update_admin"
ON public.course_enrollments FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Course Pricing: Everyone can read, only admin can manage
DROP POLICY IF EXISTS "pricing_select_all" ON public.course_pricing;
CREATE POLICY "pricing_select_all"
ON public.course_pricing FOR SELECT
USING (true);

DROP POLICY IF EXISTS "pricing_write_admin" ON public.course_pricing;
CREATE POLICY "pricing_write_admin"
ON public.course_pricing FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Coupons: Everyone can read active coupons, only admin can manage
DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
CREATE POLICY "coupons_select_active"
ON public.coupons FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "coupons_write_admin" ON public.coupons;
CREATE POLICY "coupons_write_admin"
ON public.coupons FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to check if user has access to course content based on enrollment
CREATE OR REPLACE FUNCTION public.has_course_access(
  p_user_id uuid,
  p_course_id uuid,
  p_required_plan text DEFAULT 'free'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_enrollment record;
  v_plan_level int;
  v_required_level int;
BEGIN
  -- Plan hierarchy: free=0, plus=1, pro=2
  v_required_level := CASE p_required_plan
    WHEN 'free' THEN 0
    WHEN 'plus' THEN 1
    WHEN 'pro' THEN 2
    ELSE 0
  END;

  -- Get user's enrollment for this course
  SELECT * INTO v_enrollment
  FROM public.course_enrollments
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND status = 'active'
    AND (valid_until IS NULL OR valid_until > now());

  IF NOT FOUND THEN
    -- No enrollment, grant free access
    RETURN v_required_level = 0;
  END IF;

  -- Check if user's plan level meets requirement
  v_plan_level := CASE v_enrollment.plan
    WHEN 'free' THEN 0
    WHEN 'plus' THEN 1
    WHEN 'pro' THEN 2
    ELSE 0
  END;

  RETURN v_plan_level >= v_required_level;
END;
$$;

-- Function to get user's plan for a course
CREATE OR REPLACE FUNCTION public.get_user_plan(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan
  FROM public.course_enrollments
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND status = 'active'
    AND (valid_until IS NULL OR valid_until > now());

  RETURN COALESCE(v_plan, 'free');
END;
$$;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

-- Function to atomically increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = p_code
    AND is_active = true
    AND used_count < max_uses
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

COMMENT ON TABLE public.courses IS 'Course catalog (GPAT, NEET-PG, GATE, etc.)';
COMMENT ON TABLE public.course_enrollments IS 'User enrollment per course with plan and expiry';
COMMENT ON TABLE public.course_pricing IS 'Pricing configuration per course per plan';
COMMENT ON TABLE public.coupons IS 'Discount coupons with usage tracking';
COMMENT ON FUNCTION public.has_course_access IS 'Check if user has access to course content based on plan';
COMMENT ON FUNCTION public.get_user_plan IS 'Get user plan for a specific course';
COMMENT ON FUNCTION public.increment_coupon_usage IS 'Atomically increment coupon usage count';