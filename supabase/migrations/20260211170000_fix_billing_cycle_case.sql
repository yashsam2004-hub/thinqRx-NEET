-- Fix the billing_cycle case issue (must be lowercase: 'monthly', 'annual')
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
  v_plan_lowercase text;
  v_billing_cycle_lowercase text;
BEGIN
  -- Convert to lowercase to match CHECK constraints
  v_plan_lowercase := LOWER(p_plan_name);
  v_billing_cycle_lowercase := LOWER(p_billing_cycle);
  
  -- Get the GPAT course ID
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE code ILIKE 'gpat'
  LIMIT 1;
  
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'GPAT course not found';
  END IF;
  
  -- Update or insert course enrollment (this is what the app checks!)
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
    v_plan_lowercase,    -- lowercase: 'free', 'plus', 'pro'
    'active',
    p_valid_until,
    v_billing_cycle_lowercase  -- lowercase: 'monthly', 'annual'
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

COMMENT ON FUNCTION public.update_user_subscription IS 'Updates subscription in course_enrollments (lowercase) and profiles tables. Bypasses RLS with SECURITY DEFINER.';
