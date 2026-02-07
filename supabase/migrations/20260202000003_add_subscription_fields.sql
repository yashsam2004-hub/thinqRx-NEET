-- =====================================================
-- Migration: Add Subscription & Payment Support
-- Purpose: Enable Razorpay payment tracking and subscription management
-- Date: 2026-02-02
-- =====================================================

-- 1. Add subscription fields to profiles table (if not exists)
DO $$ 
BEGIN
  -- Add subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN subscription_status TEXT DEFAULT 'inactive' 
    CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled'));
  END IF;

  -- Add subscription_end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;

  -- Add billing_cycle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN billing_cycle TEXT 
    CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL'));
  END IF;

  -- Add razorpay_customer_id (for future use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'razorpay_customer_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN razorpay_customer_id TEXT;
  END IF;
END $$;

-- 2. Create or update payments table
-- First, create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add/update columns one by one (idempotent)
DO $$ 
BEGIN
  -- Add razorpay_order_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN razorpay_order_id TEXT;
  END IF;

  -- Add razorpay_payment_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN razorpay_payment_id TEXT;
  END IF;

  -- Add plan_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN plan_name TEXT NOT NULL DEFAULT 'Free';
  END IF;

  -- Add billing_cycle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN billing_cycle TEXT;
  END IF;

  -- Add amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN amount NUMERIC NOT NULL DEFAULT 0;
  END IF;

  -- Add currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN currency TEXT DEFAULT 'INR';
  END IF;

  -- Add status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
  END IF;

  -- Add completed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- Add notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN notes JSONB;
  END IF;
END $$;

-- Add constraints (using DO blocks to handle "already exists" errors)
DO $$ 
BEGIN
  -- Add check constraint for plan_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'payments' AND constraint_name = 'payments_plan_name_check'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_plan_name_check 
      CHECK (plan_name IN ('PLUS', 'PRO', 'Free'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists, ignore
END $$;

DO $$ 
BEGIN
  -- Add check constraint for billing_cycle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'payments' AND constraint_name = 'payments_billing_cycle_check'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_billing_cycle_check 
      CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists, ignore
END $$;

DO $$ 
BEGIN
  -- Add check constraint for status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'payments' AND constraint_name = 'payments_status_check'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
      CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists, ignore
END $$;

-- Add unique constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_razorpay_order_id_key'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_razorpay_order_id_key UNIQUE (razorpay_order_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_razorpay_payment_id_key'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_razorpay_payment_id_key UNIQUE (razorpay_payment_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_user_order_unique'
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_user_order_unique UNIQUE (user_id, razorpay_order_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date ON public.profiles(subscription_end_date);

-- 4. Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS payments_select_own ON public.payments;
DROP POLICY IF EXISTS payments_admin_all ON public.payments;

-- Users can view their own payments
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view/manage all payments
CREATE POLICY payments_admin_all ON public.payments
  FOR ALL
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 6. Create helper function: Check if user has active subscription
CREATE OR REPLACE FUNCTION public.is_user_subscribed(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_subscription_status TEXT;
  user_subscription_end_date TIMESTAMPTZ;
BEGIN
  SELECT subscription_status, subscription_end_date
  INTO user_subscription_status, user_subscription_end_date
  FROM public.profiles
  WHERE id = check_user_id;

  -- Check if subscription is active and not expired
  IF user_subscription_status = 'active' 
     AND user_subscription_end_date IS NOT NULL 
     AND user_subscription_end_date > NOW() THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- 7. Create helper function: Check if user is Pro
CREATE OR REPLACE FUNCTION public.is_user_pro(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  user_subscription_status TEXT;
  user_subscription_end_date TIMESTAMPTZ;
BEGIN
  SELECT subscription_plan, subscription_status, subscription_end_date
  INTO user_plan, user_subscription_status, user_subscription_end_date
  FROM public.profiles
  WHERE id = check_user_id;

  -- Check if user has Pro plan and active subscription
  IF user_plan = 'Pro' 
     AND user_subscription_status = 'active' 
     AND user_subscription_end_date IS NOT NULL 
     AND user_subscription_end_date > NOW() THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- 8. Create helper function: Check if user is Plus or higher
CREATE OR REPLACE FUNCTION public.is_user_plus_or_higher(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  user_subscription_status TEXT;
  user_subscription_end_date TIMESTAMPTZ;
BEGIN
  SELECT subscription_plan, subscription_status, subscription_end_date
  INTO user_plan, user_subscription_status, user_subscription_end_date
  FROM public.profiles
  WHERE id = check_user_id;

  -- Check if user has Plus or Pro plan and active subscription
  IF user_plan IN ('Plus', 'Pro')
     AND user_subscription_status = 'active' 
     AND user_subscription_end_date IS NOT NULL 
     AND user_subscription_end_date > NOW() THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- 9. Create trigger to auto-expire subscriptions
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If subscription end date has passed, mark as expired
  IF NEW.subscription_end_date IS NOT NULL 
     AND NEW.subscription_end_date < NOW() 
     AND NEW.subscription_status = 'active' THEN
    NEW.subscription_status := 'expired';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_check_subscription_expiry ON public.profiles;

-- Create trigger
CREATE TRIGGER trigger_check_subscription_expiry
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_expiry();

-- 10. Billing cycle column already handled above in step 2

-- =====================================================
-- Verification Queries (Run to check setup)
-- =====================================================

-- Check profiles table has subscription fields
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Profiles Table Subscription Fields ===';
  
  FOR rec IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('subscription_status', 'subscription_end_date', 'billing_cycle', 'razorpay_customer_id')
    ORDER BY column_name
  LOOP
    RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
      rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
  END LOOP;
END $$;

-- Check payments table exists and has correct structure
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Payments Table Structure ===';
  
  FOR rec IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: %, Type: %, Nullable: %', 
      rec.column_name, rec.data_type, rec.is_nullable;
  END LOOP;
END $$;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'payments'
ORDER BY policyname;

-- Check helper functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_subscribed', 'is_user_pro', 'is_user_plus_or_higher', 'check_subscription_expiry')
ORDER BY routine_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription & Payment schema setup complete!';
  RAISE NOTICE 'Tables: profiles (updated), payments (created)';
  RAISE NOTICE 'Functions: is_user_subscribed(), is_user_pro(), is_user_plus_or_higher()';
  RAISE NOTICE 'Trigger: Auto-expire subscriptions';
  RAISE NOTICE 'RLS: Enabled with proper policies';
END $$;
