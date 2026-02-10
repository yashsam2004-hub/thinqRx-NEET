-- =====================================================
-- Fix Payments Table RLS - Allow Users to Insert Their Own Payments
-- =====================================================
-- Issue: Users cannot create payment records due to missing INSERT policy
-- Solution: Add policy allowing users to insert payments for themselves

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS payments_select_own ON public.payments;
DROP POLICY IF EXISTS payments_insert_own ON public.payments;
DROP POLICY IF EXISTS payments_admin_all ON public.payments;

-- Policy 1: Users can SELECT their own payments
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own payments (NEW - fixes the issue)
CREATE POLICY payments_insert_own ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins can do everything
CREATE POLICY payments_admin_all ON public.payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Verify policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
  AND tablename = 'payments';
  
  IF policy_count >= 3 THEN
    RAISE NOTICE '✅ Payments RLS policies fixed: % policies active', policy_count;
    RAISE NOTICE '   - payments_select_own: Users can view their own payments';
    RAISE NOTICE '   - payments_insert_own: Users can create their own payments (NEW)';
    RAISE NOTICE '   - payments_admin_all: Admins have full access';
  ELSE
    RAISE WARNING '⚠️  Expected 3+ policies, found only %', policy_count;
  END IF;
END $$;
