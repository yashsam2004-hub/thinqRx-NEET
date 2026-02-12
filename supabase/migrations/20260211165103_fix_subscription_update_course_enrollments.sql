-- Update the subscription function to also update course_enrollments table
-- This fixes the issue where payment succeeds but subscription isn't recognized

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
BEGIN
  -- Convert plan name to lowercase for course_enrollments (uses lowercase: 'free', 'plus', 'pro')
  v_plan_lowercase := LOWER(p_plan_name);
  
  -- Get the GPAT course ID (assuming there's only one active course)
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
    v_plan_lowercase,
    'active',
    p_valid_until,
    UPPER(p_billing_cycle)
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    valid_until = EXCLUDED.valid_until,
    billing_cycle = EXCLUDED.billing_cycle;
  
  -- Also update the profiles table for consistency
  UPDATE public.profiles
  SET 
    subscription_plan = p_plan_name,
    subscription_status = 'active',
    subscription_end_date = p_valid_until,
    billing_cycle = p_billing_cycle
  WHERE id = p_user_id;
  
  -- Raise an error if no profile was found/updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', p_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.update_user_subscription TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_user_subscription IS 'Updates user subscription in BOTH course_enrollments and profiles tables. Runs with SECURITY DEFINER to bypass RLS. Used by payment verification after successful payment.';
