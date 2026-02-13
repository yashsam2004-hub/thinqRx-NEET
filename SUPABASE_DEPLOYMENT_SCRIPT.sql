-- =================================================================
-- DEPLOYMENT SCRIPT FOR SUPABASE
-- Execute these in order in Supabase SQL Editor
-- =================================================================

-- STEP 1: Remove CHECK Constraints
-- This allows dynamic plan IDs from the plans table
-- =================================================================

ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_plan_check;
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_billing_cycle_check;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;

COMMENT ON TABLE course_enrollments IS 'Plan and billing_cycle now accept any value from plans table - no CHECK constraints';
COMMENT ON TABLE profiles IS 'Subscription fields now accept any value from plans table - no CHECK constraints';

-- Verify: Should show "Query returned successfully"
SELECT 'Step 1 Complete: CHECK constraints removed' as status;


-- =================================================================
-- STEP 2: Simplify update_user_subscription RPC
-- Removes case conversions, stores values as-is
-- =================================================================

DROP FUNCTION IF EXISTS public.update_user_subscription;

CREATE OR REPLACE FUNCTION public.update_user_subscription(
  p_user_id uuid,
  p_plan_name text,
  p_billing_cycle text,
  p_valid_until timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
BEGIN
  -- Get the GPAT course ID
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE code ILIKE 'gpat'
  LIMIT 1;
  
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'GPAT course not found';
  END IF;
  
  -- Update or insert course enrollment (store values as-is)
  INSERT INTO public.course_enrollments (
    user_id,
    course_id,
    plan,
    status,
    valid_until,
    billing_cycle
  )
  VALUES (
    p_user_id,
    v_course_id,
    p_plan_name,           -- Store as-is (no case conversion)
    'active',
    p_valid_until,
    p_billing_cycle        -- Store as-is (no case conversion)
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    valid_until = EXCLUDED.valid_until,
    billing_cycle = EXCLUDED.billing_cycle;
  
  -- Also update profiles table (keeps both tables in sync)
  UPDATE public.profiles
  SET 
    subscription_plan = p_plan_name,
    subscription_status = 'active',
    subscription_end_date = p_valid_until,
    billing_cycle = p_billing_cycle
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_subscription TO authenticated, service_role;

COMMENT ON FUNCTION public.update_user_subscription IS 'Updates subscription in both course_enrollments and profiles tables. Stores plan IDs as-is without case conversion. Bypasses RLS with SECURITY DEFINER.';

-- Verify: Should show "Query returned successfully"
SELECT 'Step 2 Complete: RPC function updated' as status;


-- =================================================================
-- STEP 3: Fix pskiran4u@gmail.com subscription
-- Manual activation for failed payment verification
-- =================================================================

-- 3A: First, get the user UUID
SELECT id, email FROM auth.users WHERE email = 'pskiran4u@gmail.com';

-- 3B: Copy the UUID from the result above and paste it in the script below
-- Replace 'PASTE_UUID_HERE' with the actual UUID

DO $$
DECLARE
  v_course_id uuid;
  v_user_id uuid := 'PASTE_UUID_HERE';  -- ⚠️ REPLACE THIS WITH ACTUAL UUID FROM STEP 3A
BEGIN
  -- Get the GPAT course ID
  SELECT id INTO v_course_id FROM courses WHERE code ILIKE 'gpat' LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'GPAT course not found';
  END IF;

  -- Insert or update course enrollment
  INSERT INTO course_enrollments (user_id, course_id, plan, status, billing_cycle, valid_until)
  VALUES (v_user_id, v_course_id, 'gpat_last_minute', 'active', 'monthly', NOW() + INTERVAL '31 days')
  ON CONFLICT (user_id, course_id) DO UPDATE SET
    plan = 'gpat_last_minute', 
    status = 'active', 
    billing_cycle = 'monthly', 
    valid_until = NOW() + INTERVAL '31 days';

  -- Update profile subscription info
  UPDATE profiles SET
    subscription_plan = 'gpat_last_minute',
    subscription_status = 'active',
    billing_cycle = 'MONTHLY',
    subscription_end_date = NOW() + INTERVAL '31 days'
  WHERE id = v_user_id;

  -- Update payment record status if exists
  UPDATE payments SET
    status = 'completed',
    completed_at = NOW()
  WHERE user_id = v_user_id 
    AND plan_name ILIKE '%gpat%last%minute%'
    AND status = 'pending';

  RAISE NOTICE 'Subscription activated successfully for user %', v_user_id;
END $$;

-- Verify: Should show "Subscription activated successfully"


-- =================================================================
-- VERIFICATION QUERIES
-- Run these to confirm everything is working
-- =================================================================

-- Check pskiran4u subscription status
SELECT 
  p.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end_date,
  ce.plan,
  ce.status,
  ce.valid_until
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN course_enrollments ce ON p.id = ce.user_id
WHERE au.email = 'pskiran4u@gmail.com';

-- Check all exam pack users
SELECT 
  au.email,
  p.subscription_plan,
  p.subscription_status,
  ce.plan,
  ce.status
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN course_enrollments ce ON p.id = ce.user_id
WHERE p.subscription_plan IN ('gpat_last_minute', 'gpat_2027_full')
ORDER BY p.created_at DESC;

-- =================================================================
-- DEPLOYMENT COMPLETE ✅
-- =================================================================
