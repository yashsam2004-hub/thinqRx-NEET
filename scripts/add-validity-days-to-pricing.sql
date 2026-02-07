-- ============================================
-- ADD VALIDITY DAYS TO PRICING TABLE
-- ============================================
-- Add validity_days column to course_pricing table
-- This allows admins to set different validity periods for each plan

-- 1. Add validity_days column
ALTER TABLE public.course_pricing 
ADD COLUMN IF NOT EXISTS validity_days INTEGER;

-- 2. Set default values
UPDATE public.course_pricing
SET validity_days = CASE
  WHEN plan = 'free' THEN NULL  -- Free = lifetime (no expiry)
  WHEN plan = 'plus' THEN 365   -- Plus = 365 days
  WHEN plan = 'pro' THEN 365    -- Pro = 365 days
  ELSE 365
END
WHERE validity_days IS NULL;

-- 3. Add comment
COMMENT ON COLUMN public.course_pricing.validity_days IS 
  'Number of days the plan is valid for. NULL = lifetime access (for free plan)';

-- 4. Verify changes
SELECT 
  plan,
  monthly_price,
  annual_price,
  validity_days,
  CASE 
    WHEN validity_days IS NULL THEN 'Lifetime'
    ELSE validity_days || ' days'
  END as validity
FROM public.course_pricing
ORDER BY 
  CASE plan 
    WHEN 'free' THEN 1 
    WHEN 'plus' THEN 2 
    WHEN 'pro' THEN 3 
  END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ validity_days column added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Current validity:';
  RAISE NOTICE '  • Free: Lifetime (NULL)';
  RAISE NOTICE '  • Plus: 365 days';
  RAISE NOTICE '  • Pro: 365 days';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 You can now edit validity in /admin/pricing';
END $$;
