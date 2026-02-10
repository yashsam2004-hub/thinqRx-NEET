-- =====================================================
-- URGENT FIX: Run this SQL in Supabase Dashboard NOW
-- =====================================================
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire script and click "Run"
-- =====================================================

-- Add INSERT policy for users to create their own payment records
DROP POLICY IF EXISTS payments_insert_own ON public.payments;

CREATE POLICY payments_insert_own ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify the fix
SELECT 
  'Policy Created: ' || policyname as status,
  cmd as applies_to,
  CASE 
    WHEN policyname = 'payments_insert_own' THEN '✅ FIXED - Users can now insert payments'
    ELSE 'Existing policy'
  END as description
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'payments'
ORDER BY policyname;
