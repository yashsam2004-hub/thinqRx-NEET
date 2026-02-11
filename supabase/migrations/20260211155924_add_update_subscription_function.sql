-- Function to update user subscription (bypasses RLS completely)
-- This function runs with SECURITY DEFINER, giving it elevated privileges to bypass RLS
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
BEGIN
  -- Update the user's subscription details in the profiles table
  UPDATE public.profiles
  SET 
    subscription_plan = p_plan_name,
    subscription_status = 'active',
    subscription_end_date = p_valid_until,
    billing_cycle = p_billing_cycle,
    updated_at = NOW()
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
COMMENT ON FUNCTION public.update_user_subscription IS 'Updates user subscription details. Runs with SECURITY DEFINER to bypass RLS policies. Used by payment verification after successful payment.';
