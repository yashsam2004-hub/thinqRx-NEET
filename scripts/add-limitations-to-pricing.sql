-- ============================================
-- ADD LIMITATIONS FIELD TO PRICING TABLE
-- ============================================
-- Allows admins to set "What you'll miss" section for each plan

-- 1. Add limitations column
ALTER TABLE public.course_pricing 
ADD COLUMN IF NOT EXISTS limitations JSONB DEFAULT '[]'::jsonb;

-- 2. Set default limitations
DO $$
DECLARE
  gpat_course_id UUID;
BEGIN
  -- Get GPAT course ID
  SELECT id INTO gpat_course_id
  FROM public.courses
  WHERE code = 'gpat'
  LIMIT 1;

  IF gpat_course_id IS NULL THEN
    RAISE EXCEPTION 'GPAT course not found';
  END IF;

  -- Free plan limitations
  UPDATE public.course_pricing
  SET limitations = jsonb_build_array(
    'No mock tests',
    'No analytics',
    'Limited AI notes (5/day)'
  )
  WHERE course_id = gpat_course_id AND plan = 'free';

  -- Plus plan limitations
  UPDATE public.course_pricing
  SET limitations = jsonb_build_array(
    'No GPAT mock tests',
    'No performance analytics'
  )
  WHERE course_id = gpat_course_id AND plan = 'plus';

  -- Pro plan limitations (none)
  UPDATE public.course_pricing
  SET limitations = '[]'::jsonb
  WHERE course_id = gpat_course_id AND plan = 'pro';

  RAISE NOTICE '✅ Limitations column added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Default limitations set:';
  RAISE NOTICE '  • Free: 3 limitations';
  RAISE NOTICE '  • Plus: 2 limitations';
  RAISE NOTICE '  • Pro: 0 limitations (full access)';
END $$;

-- 3. Add comment
COMMENT ON COLUMN public.course_pricing.limitations IS 
  'Array of limitations for this plan. Shown in "What you''ll miss" section on pricing page.';

-- 4. Verify
SELECT 
  plan,
  jsonb_array_length(features) as feature_count,
  jsonb_array_length(limitations) as limitation_count
FROM public.course_pricing
WHERE course_id = (SELECT id FROM public.courses WHERE code = 'gpat' LIMIT 1)
ORDER BY 
  CASE plan 
    WHEN 'free' THEN 1 
    WHEN 'plus' THEN 2 
    WHEN 'pro' THEN 3 
  END;
