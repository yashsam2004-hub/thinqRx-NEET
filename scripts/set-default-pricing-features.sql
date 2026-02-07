-- ============================================
-- SET DEFAULT PRICING FEATURES
-- ============================================
-- Run this in Supabase SQL Editor to populate default features
-- These features will appear on your pricing page

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
    RAISE EXCEPTION 'GPAT course not found. Please create it first.';
  END IF;

  -- ============================================
  -- FREE PLAN FEATURES
  -- ============================================
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id,
    'free',
    0,
    0,
    jsonb_build_array(
      'Access to free content only',
      'Limited practice tests (3/day)',
      'Basic progress tracking',
      'Community support'
    )
  )
  ON CONFLICT (course_id, plan)
  DO UPDATE SET
    monthly_price = 0,
    annual_price = 0,
    features = jsonb_build_array(
      'Access to free content only',
      'Limited practice tests (3/day)',
      'Basic progress tracking',
      'Community support'
    ),
    updated_at = NOW();

  -- ============================================
  -- PLUS PLAN FEATURES
  -- ============================================
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id,
    'plus',
    199,
    2388,
    jsonb_build_array(
      'Everything in Free, PLUS:',
      'Unlimited AI-powered notes',
      'Unlimited practice tests',
      'Full syllabus coverage (170+ topics)',
      '365 days validity (1 year access)',
      'Access to all content',
      'All practice tests',
      'Full syllabus coverage'
    )
  )
  ON CONFLICT (course_id, plan)
  DO UPDATE SET
    monthly_price = 199,
    annual_price = 2388,
    features = jsonb_build_array(
      'Everything in Free, PLUS:',
      'Unlimited AI-powered notes',
      'Unlimited practice tests',
      'Full syllabus coverage (170+ topics)',
      '365 days validity (1 year access)',
      'Access to all content',
      'All practice tests',
      'Full syllabus coverage'
    ),
    updated_at = NOW();

  -- ============================================
  -- PRO PLAN FEATURES
  -- ============================================
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id,
    'pro',
    499,
    5090,
    jsonb_build_array(
      'Everything in Plus, plus:',
      '15+ Full GPAT mock tests (125 MCQs)',
      'AI-powered performance analytics',
      'Personalized weak area identification',
      'Adaptive study plans',
      'Rank prediction algorithm',
      '365 days validity (1 year access)',
      'Everything in Plus',
      'Full mock exams (GPAT scheme)',
      'Personalized Analytics',
      'Adaptive study plans',
      'Performance insights'
    )
  )
  ON CONFLICT (course_id, plan)
  DO UPDATE SET
    monthly_price = 499,
    annual_price = 5090,
    features = jsonb_build_array(
      'Everything in Plus, plus:',
      '15+ Full GPAT mock tests (125 MCQs)',
      'AI-powered performance analytics',
      'Personalized weak area identification',
      'Adaptive study plans',
      'Rank prediction algorithm',
      '365 days validity (1 year access)',
      'Everything in Plus',
      'Full mock exams (GPAT scheme)',
      'Personalized Analytics',
      'Adaptive study plans',
      'Performance insights'
    ),
    updated_at = NOW();

  RAISE NOTICE '✅ Default pricing and features set successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Pricing configured:';
  RAISE NOTICE '  • Free: ₹0 (4 features)';
  RAISE NOTICE '  • Plus: ₹199/month or ₹2,388/year (8 features)';
  RAISE NOTICE '  • Pro: ₹499/month or ₹5,090/year (12 features)';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 You can now edit features in /admin/pricing';
  RAISE NOTICE '📱 Visit /pricing to see the updated pricing page';
END $$;

-- ============================================
-- VERIFY RESULTS
-- ============================================
SELECT 
  c.name as course,
  p.plan,
  p.monthly_price,
  p.annual_price,
  jsonb_array_length(p.features) as feature_count
FROM public.course_pricing p
JOIN public.courses c ON c.id = p.course_id
WHERE c.code = 'gpat'
ORDER BY 
  CASE p.plan 
    WHEN 'free' THEN 1 
    WHEN 'plus' THEN 2 
    WHEN 'pro' THEN 3 
  END;
