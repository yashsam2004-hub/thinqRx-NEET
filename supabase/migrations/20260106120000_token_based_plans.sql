-- Add token-based columns to subscriptions and user_entitlements
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_name text DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS monthly_token_limit integer DEFAULT 500;

ALTER TABLE public.user_entitlements
ADD COLUMN IF NOT EXISTS tokens_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_reset_at timestamptz DEFAULT now();

-- Update existing subscriptions with token limits
UPDATE public.subscriptions
SET plan_name = 'FREE', monthly_token_limit = 500
WHERE status = 'active' AND plan_name IS NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id_tokens 
ON public.user_entitlements(user_id, tokens_used);

-- Function to reset tokens monthly
CREATE OR REPLACE FUNCTION reset_user_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_entitlements
  SET tokens_used = 0,
      tokens_reset_at = now()
  WHERE tokens_reset_at < (now() - INTERVAL '1 month');
END;
$$;

-- Add comment
COMMENT ON FUNCTION reset_user_tokens IS 'Reset monthly token usage for all users (run via cron)';

