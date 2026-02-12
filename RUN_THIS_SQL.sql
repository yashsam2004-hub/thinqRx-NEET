-- ========================================
-- ThinqRx: Complete Database Setup
-- Run this entire file in Supabase SQL Editor
-- ========================================

-- ========================================
-- PART 1: AI Cache Table (Cost Reduction)
-- ========================================

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  content_type TEXT NOT NULL,
  exam TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  version TEXT NOT NULL DEFAULT 'V1',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_exam_subject ON public.ai_cache(exam, subject);
CREATE INDEX IF NOT EXISTS idx_ai_cache_content_type ON public.ai_cache(content_type);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read ai_cache" ON public.ai_cache;
DROP POLICY IF EXISTS "Service role can manage ai_cache" ON public.ai_cache;

CREATE POLICY "Authenticated users can read ai_cache"
  ON public.ai_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage ai_cache"
  ON public.ai_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION generate_cache_key(
  p_content_type TEXT,
  p_exam TEXT,
  p_subject TEXT,
  p_topic TEXT DEFAULT NULL,
  p_version TEXT DEFAULT 'V1'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_topic IS NOT NULL THEN
    RETURN p_content_type || ':' || p_exam || ':' || p_subject || ':' || p_topic || ':' || p_version;
  ELSE
    RETURN p_content_type || ':' || p_exam || ':' || p_subject || ':' || p_version;
  END IF;
END;
$$;

-- ========================================
-- PART 2: Plans Table (Monetization)
-- ========================================

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 999,
  plan_category TEXT DEFAULT 'subscription',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Service role can manage plans" ON public.plans;

CREATE POLICY "Anyone can view active plans"
  ON public.plans
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage plans"
  ON public.plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert GPAT 2027 Full Prep (HERO PLAN)
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order, plan_category)
VALUES (
  'gpat_2027_full',
  'GPAT 2027 Full Prep',
  999,
  365,
  'Complete GPAT preparation with full access to all features',
  jsonb_build_object(
    'ai_notes_limit', 999,
    'practice_tests_limit', 999,
    'explanations', 'full',
    'analytics', 'advanced',
    'validity', '365 days (1 year)',
    'regenerate_notes', true,
    'best_for', 'Serious GPAT 2027 aspirants'
  ),
  true,
  1,
  'exam_pack'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  validity_days = EXCLUDED.validity_days,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  plan_category = EXCLUDED.plan_category;

-- Insert GPAT Last Minute Pack
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order, plan_category)
VALUES (
  'gpat_last_minute',
  'GPAT Last Minute Pack',
  299,
  60,
  'High-yield revision for GPAT exam preparation',
  jsonb_build_object(
    'ai_notes_limit', 50,
    'practice_tests_limit', 10,
    'explanations', 'partial',
    'analytics', 'basic',
    'validity', '60 days',
    'best_for', 'Students with 2-3 months left for GPAT'
  ),
  true,
  2,
  'exam_pack'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  validity_days = EXCLUDED.validity_days,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  plan_category = EXCLUDED.plan_category;

-- Insert Free Plan
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order, plan_category)
VALUES (
  'free',
  'Free Plan',
  0,
  9999,
  'Basic access to get started',
  jsonb_build_object(
    'ai_notes_limit', 5,
    'practice_tests_limit', 1,
    'explanations', 'none',
    'analytics', 'none',
    'validity', 'Forever',
    'best_for', 'Students exploring the platform'
  ),
  true,
  5,
  'subscription'
)
ON CONFLICT (id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  plan_category = EXCLUDED.plan_category;

-- Insert Plus Plan
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order, plan_category)
VALUES (
  'plus',
  'Plus Plan',
  199,
  31,
  'Monthly subscription with more features',
  jsonb_build_object(
    'ai_notes_limit', 100,
    'practice_tests_limit', 50,
    'explanations', 'partial',
    'analytics', 'basic',
    'validity', '31 days',
    'best_for', 'Regular learners'
  ),
  true,
  3,
  'subscription'
)
ON CONFLICT (id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  plan_category = EXCLUDED.plan_category;

-- Insert Pro Plan
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order, plan_category)
VALUES (
  'pro',
  'Pro Plan',
  299,
  31,
  'Monthly subscription with all features',
  jsonb_build_object(
    'ai_notes_limit', 999,
    'practice_tests_limit', 999,
    'explanations', 'full',
    'analytics', 'advanced',
    'validity', '31 days',
    'best_for', 'Power users'
  ),
  true,
  4,
  'subscription'
)
ON CONFLICT (id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  plan_category = EXCLUDED.plan_category;

-- ========================================
-- PART 3: Usage Counters (Feature Limits)
-- ========================================

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  counter_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  usage_limit INTEGER NOT NULL,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_id, counter_type)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_user ON public.usage_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_plan ON public.usage_counters(user_id, plan_id);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_counters;
DROP POLICY IF EXISTS "Service role can manage usage" ON public.usage_counters;

CREATE POLICY "Users can view their own usage"
  ON public.usage_counters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.usage_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- PART 4: Helper Functions
-- ========================================

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_counter_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT count, usage_limit INTO v_count, v_limit
  FROM public.usage_counters
  WHERE user_id = p_user_id
    AND counter_type = p_counter_type
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  RETURN v_count < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_plan_id TEXT,
  p_counter_type TEXT,
  p_usage_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_counters (user_id, plan_id, counter_type, count, usage_limit)
  VALUES (p_user_id, p_plan_id, p_counter_type, 1, p_usage_limit)
  ON CONFLICT (user_id, plan_id, counter_type)
  DO UPDATE SET
    count = usage_counters.count + 1,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check plans created
SELECT id, name, price, validity_days, display_order, plan_category, is_active 
FROM plans 
ORDER BY display_order;

-- Expected output:
-- gpat_2027_full | GPAT 2027 Full Prep | 999 | 365 | 1 | exam_pack | true
-- gpat_last_minute | GPAT Last Minute Pack | 299 | 60 | 2 | exam_pack | true
-- plus | Plus Plan | 199 | 31 | 3 | subscription | true
-- pro | Pro Plan | 299 | 31 | 4 | subscription | true
-- free | Free Plan | 0 | 9999 | 5 | subscription | true

-- Check tables exist
SELECT COUNT(*) as ai_cache_ready FROM ai_cache;
SELECT COUNT(*) as usage_counters_ready FROM usage_counters;

-- ✅ SUCCESS! Your database is ready for AI caching and new plans!
