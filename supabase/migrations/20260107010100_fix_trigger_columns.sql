-- Fix the handle_new_user trigger to use correct column names
-- The user_entitlements table uses different column names than the trigger was trying to insert

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');

  -- Create FREE subscription with token limit (include plan column!)
  INSERT INTO public.subscriptions (user_id, plan, status, plan_name, monthly_token_limit)
  VALUES (NEW.id, 'FREE', 'active', 'FREE', 500);

  -- Create entitlements with token tracking (use CORRECT column names!)
  INSERT INTO public.user_entitlements (
    user_id,
    plan,
    ai_daily_limit,
    topics_preview_only,
    can_custom_tests,
    can_mock_tests,
    can_grand_tests,
    tokens_used,
    tokens_reset_at
  )
  VALUES (
    NEW.id,
    'FREE',
    3,
    true,  -- topics_preview_only (FREE users get preview only)
    false, -- can_custom_tests (PRO only)
    false, -- can_mock_tests (PRO only)
    false, -- can_grand_tests (PRO only)
    0,     -- tokens_used
    now()  -- tokens_reset_at
  );

  RETURN NEW;
END;
$$;

