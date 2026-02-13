-- Manual subscription activation for pskiran4u@gmail.com
-- This script activates the GPAT Last Minute Pack purchase that was paid but verification failed

-- Step 1: Get the user UUID
-- Run this first to get the UUID:
-- SELECT id, email FROM auth.users WHERE email = 'pskiran4u@gmail.com';

-- Step 2: Activate subscription (replace 'PASTE_UUID_HERE' with actual UUID from Step 1)
DO $$
DECLARE
  v_course_id uuid;
  v_user_id uuid := 'PASTE_UUID_HERE';  -- REPLACE THIS WITH ACTUAL UUID
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
