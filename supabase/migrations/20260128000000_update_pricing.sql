-- Update Pricing Plans
-- Date: 2026-01-28
-- Purpose: Update pricing structure with new Plus plan and Pro pricing

-- ============================================
-- 1. UPDATE COURSE PRICING
-- ============================================

-- Get GPAT course ID
DO $$
DECLARE
  gpat_course_id uuid;
BEGIN
  SELECT id INTO gpat_course_id
  FROM public.courses
  WHERE code = 'gpat';

  -- Update Free plan pricing (no change)
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id, 
    'free', 
    0, 
    0,
    '["Access to free content only", "Free practice tests", "Basic progress tracking", "Community support"]'::jsonb
  )
  ON CONFLICT (course_id, plan) 
  DO UPDATE SET
    monthly_price = 0,
    annual_price = 0,
    features = '["Access to free content only", "Free practice tests", "Basic progress tracking", "Community support"]'::jsonb,
    updated_at = now();

  -- Insert/Update Plus plan pricing (NEW)
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id, 
    'plus', 
    0,  -- No monthly option
    199,
    '["Access to all content", "All practice tests", "Full syllabus coverage", "Progress tracking", "Email support"]'::jsonb
  )
  ON CONFLICT (course_id, plan) 
  DO UPDATE SET
    monthly_price = 0,
    annual_price = 199,
    features = '["Access to all content", "All practice tests", "Full syllabus coverage", "Progress tracking", "Email support"]'::jsonb,
    updated_at = now();

  -- Update Pro plan pricing
  INSERT INTO public.course_pricing (course_id, plan, monthly_price, annual_price, features)
  VALUES (
    gpat_course_id, 
    'pro', 
    499,
    5090,  -- 15% discount: 499 * 12 * 0.85 = 5089.8 rounded to 5090
    '["Everything in Plus", "Full mock exams (GPAT scheme)", "Personalized Analytics", "Adaptive study plans", "Performance insights", "Priority support"]'::jsonb
  )
  ON CONFLICT (course_id, plan) 
  DO UPDATE SET
    monthly_price = 499,
    annual_price = 5090,
    features = '["Everything in Plus", "Full mock exams (GPAT scheme)", "Personalized Analytics", "Adaptive study plans", "Performance insights", "Priority support"]'::jsonb,
    updated_at = now();

  RAISE NOTICE '✅ Pricing updated successfully!';
END $$;

-- ============================================
-- 2. VERIFY PRICING
-- ============================================

DO $$
DECLARE
  pricing_record RECORD;
BEGIN
  RAISE NOTICE 'Current pricing:';
  FOR pricing_record IN 
    SELECT p.plan, p.monthly_price, p.annual_price
    FROM public.course_pricing p
    JOIN public.courses c ON c.id = p.course_id
    WHERE c.code = 'gpat'
    ORDER BY 
      CASE p.plan 
        WHEN 'free' THEN 1 
        WHEN 'plus' THEN 2 
        WHEN 'pro' THEN 3 
      END
  LOOP
    RAISE NOTICE '  % - Monthly: ₹%, Annual: ₹%', 
      pricing_record.plan, 
      pricing_record.monthly_price, 
      pricing_record.annual_price;
  END LOOP;
END $$;
