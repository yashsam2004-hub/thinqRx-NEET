-- Add new exam-focused plans for better monetization
-- Keep existing Plus/Pro plans, add GPAT Last Minute and Full Prep packs

-- First, let's check the current plans table structure
-- Assuming it has: id, name, price, validity_days, features, etc.

-- Insert new exam-focused plans
-- Note: Adjust column names based on your actual schema

-- GPAT Last Minute Preparation Pack (₹299, 60 days)
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order)
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
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  validity_days = EXCLUDED.validity_days,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order;

-- GPAT 2027 Full Preparation Pack (₹999, 365 days) - HERO PLAN
INSERT INTO public.plans (id, name, price, validity_days, description, features, is_active, display_order)
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
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  validity_days = EXCLUDED.validity_days,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order;

-- Update existing plans display order (de-emphasize)
UPDATE public.plans
SET display_order = 3
WHERE id = 'plus';

UPDATE public.plans
SET display_order = 4
WHERE id = 'pro';

-- Add plan_category column if it doesn't exist
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS plan_category TEXT DEFAULT 'subscription';

-- Categorize plans
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
  limit INTEGER NOT NULL,
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
  SELECT count, limit INTO v_count, v_limit
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
  p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_counters (user_id, plan_id, counter_type, count, limit)
  VALUES (p_user_id, p_plan_id, p_counter_type, 1, p_limit)
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
