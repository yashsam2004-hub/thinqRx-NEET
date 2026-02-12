-- Add new exam-focused plans for better monetization
-- Keep existing Plus/Pro plans, add GPAT Last Minute and Full Prep packs

-- ========================================
-- STEP 1: Create plans table if not exists
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

-- Enable RLS on plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Service role can manage plans" ON public.plans;

-- Everyone can read plans (for pricing page)
CREATE POLICY "Anyone can view active plans"
  ON public.plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- Only service role can manage plans
CREATE POLICY "Service role can manage plans"
  ON public.plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 2: Insert/Update plans
-- ========================================

-- GPAT Last Minute Preparation Pack (₹299, 60 days)
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

-- GPAT 2027 Full Preparation Pack (₹999, 365 days) - HERO PLAN
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

-- Insert Free plan if doesn't exist
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

-- Insert Plus plan if doesn't exist
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

-- Insert Pro plan if doesn't exist
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
-- STEP 3: Categorize plans
-- ========================================
UPDATE public.plans
SET plan_category = 'exam_pack'
WHERE id IN ('gpat_last_minute', 'gpat_2027_full');

UPDATE public.plans
SET plan_category = 'subscription'
WHERE id IN ('plus', 'pro', 'free');

-- Create usage tracking table if not exists
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  counter_type TEXT NOT NULL, -- 'ai_notes', 'practice_tests', 'explanations'
  count INTEGER DEFAULT 0,
  usage_limit INTEGER NOT NULL,
  reset_at TIMESTAMPTZ, -- For monthly limits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_id, counter_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_counters_user ON public.usage_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_plan ON public.usage_counters(user_id, plan_id);

-- RLS for usage_counters
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Function to check if user has reached limit
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
    -- No counter exists, check user's plan default limits
    RETURN TRUE; -- Allow for now, counter will be created
  END IF;

  RETURN v_count < v_limit;
END;
$$;

-- Function to increment usage counter
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

COMMENT ON TABLE public.usage_counters IS 'Tracks feature usage per user per plan';
COMMENT ON FUNCTION check_usage_limit IS 'Returns true if user has not reached their limit';
COMMENT ON FUNCTION increment_usage IS 'Increments usage counter for a specific feature';
