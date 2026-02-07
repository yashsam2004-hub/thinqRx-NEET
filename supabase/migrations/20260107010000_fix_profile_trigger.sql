-- Fix the handle_new_user trigger to include 'plan' column
-- The previous trigger update forgot to include the NOT NULL 'plan' column

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

  -- Create entitlements with token tracking (include plan column!)
  INSERT INTO public.user_entitlements (
    user_id,
    plan,
    ai_notes,
    ai_topic_tests,
    custom_tests,
    mock_tests,
    grand_tests,
    analytics,
    ai_daily_limit,
    tokens_used,
    tokens_reset_at
  )
  VALUES (
    NEW.id,
    'FREE', -- plan (was missing!)
    true,  -- ai_notes (preview only for FREE)
    true,  -- ai_topic_tests (limited for FREE)
    false, -- custom_tests (PRO only)
    false, -- mock_tests (PRO only)
    false, -- grand_tests (PRO only)
    true,  -- analytics (basic for FREE)
    3,     -- ai_daily_limit (legacy, now using tokens)
    0,     -- tokens_used
    now()  -- tokens_reset_at
  );

  RETURN NEW;
END;
$$;

