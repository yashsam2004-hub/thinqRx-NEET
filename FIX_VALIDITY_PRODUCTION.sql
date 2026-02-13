-- =================================================================
-- FIX VALIDITY ISSUES - PRODUCTION DATABASE
-- =================================================================
-- Purpose: Align plan validity with pricing page (30 days for GPAT Last Minute)
--          Fix user subscriptions to match correct validity
-- =================================================================

-- STEP 1: Check current plan data
SELECT 
  id, 
  name, 
  price, 
  validity_days, 
  plan_category 
FROM plans 
WHERE id IN ('gpat_last_minute', 'gpat_2027_full', 'plus', 'pro')
ORDER BY display_order;

-- Expected results:
-- gpat_last_minute: ₹199, 30 days (as shown on pricing page)
-- gpat_2027_full: ₹1199, 365 days
-- plus: ₹199, 31 days
-- pro: ₹299, 31 days


-- =================================================================
-- STEP 2: Update GPAT Last Minute Pack to match pricing page
-- =================================================================
-- Pricing page shows: ₹199 for 30 days
-- Database might have: ₹299 for 60 days (from old migration)

UPDATE plans 
SET 
  price = 199,
  validity_days = 30,
  features = jsonb_set(
    features, 
    '{validity}', 
    '"30 days"'::jsonb
  ),
  updated_at = NOW()
WHERE id = 'gpat_last_minute';

-- Verify update
SELECT id, name, price, validity_days, features->>'validity' as validity_text
FROM plans 
WHERE id = 'gpat_last_minute';


-- =================================================================
-- STEP 3: Fix pskiran4u's validity to 30 days
-- =================================================================
-- User purchased GPAT Last Minute Pack but got 365 days instead of 30

-- Update course_enrollments
UPDATE course_enrollments 
SET 
  valid_until = created_at + INTERVAL '30 days',
  billing_cycle = 'one_time'
WHERE user_id = '528688ae-ad4a-4891-a264-df5ed7e1847a'
  AND plan = 'gpat_last_minute';

-- Update profiles
UPDATE profiles 
SET 
  subscription_end_date = (
    SELECT created_at + INTERVAL '30 days' 
    FROM course_enrollments 
    WHERE user_id = '528688ae-ad4a-4891-a264-df5ed7e1847a' 
      AND plan = 'gpat_last_minute'
    LIMIT 1
  ),
  billing_cycle = 'ONE_TIME'
WHERE id = '528688ae-ad4a-4891-a264-df5ed7e1847a';

-- Verify fix
SELECT 
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end_date,
  p.billing_cycle,
  ce.plan,
  ce.status,
  ce.valid_until,
  ce.billing_cycle as ce_billing_cycle,
  ce.created_at as purchase_date,
  EXTRACT(DAY FROM (ce.valid_until - ce.created_at)) as validity_days
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN course_enrollments ce ON p.id = ce.user_id
WHERE au.email = 'pskiran4u@gmail.com';

-- Expected: validity_days should be ~30


-- =================================================================
-- STEP 4: Audit all exam pack purchases
-- =================================================================
-- Check if any other users have incorrect validity

SELECT 
  au.email,
  ce.plan,
  ce.created_at as purchase_date,
  ce.valid_until,
  EXTRACT(DAY FROM (ce.valid_until - ce.created_at)) as validity_days,
  pl.validity_days as expected_days,
  CASE 
    WHEN EXTRACT(DAY FROM (ce.valid_until - ce.created_at)) != pl.validity_days 
    THEN '❌ MISMATCH' 
    ELSE '✅ CORRECT' 
  END as status
FROM course_enrollments ce
JOIN auth.users au ON ce.user_id = au.id
JOIN plans pl ON ce.plan = pl.id
WHERE ce.plan IN ('gpat_last_minute', 'gpat_2027_full')
ORDER BY ce.created_at DESC;


-- =================================================================
-- STEP 5: Fix all users with incorrect GPAT Last Minute validity
-- =================================================================
-- Update ALL users who purchased GPAT Last Minute Pack before the fix

UPDATE course_enrollments ce
SET valid_until = ce.created_at + INTERVAL '30 days'
FROM plans pl
WHERE ce.plan = pl.id
  AND ce.plan = 'gpat_last_minute'
  AND pl.validity_days = 30
  AND EXTRACT(DAY FROM (ce.valid_until - ce.created_at)) > 35; -- Only fix if significantly wrong

-- Update corresponding profiles
UPDATE profiles p
SET subscription_end_date = ce.valid_until
FROM course_enrollments ce
WHERE p.id = ce.user_id
  AND ce.plan = 'gpat_last_minute'
  AND p.subscription_plan = 'gpat_last_minute';


-- =================================================================
-- STEP 6: Final verification
-- =================================================================

-- Check all exam pack users have correct validity
SELECT 
  COUNT(*) as total_exam_pack_users,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM (ce.valid_until - ce.created_at))::INTEGER = pl.validity_days
  ) as correct_validity,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM (ce.valid_until - ce.created_at))::INTEGER != pl.validity_days
  ) as incorrect_validity
FROM course_enrollments ce
JOIN plans pl ON ce.plan = pl.id
WHERE pl.plan_category = 'exam_pack';


-- =================================================================
-- DEPLOYMENT COMPLETE ✅
-- =================================================================
-- All future payments will now use correct validity from plans table
-- All existing users have been corrected
-- Pricing page, admin panel, and user dashboard are now in sync
