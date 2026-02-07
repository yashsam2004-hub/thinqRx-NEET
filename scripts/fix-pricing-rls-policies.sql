-- ============================================
-- FIX COURSE_PRICING RLS POLICIES
-- ============================================
-- Run this in Supabase SQL Editor if pricing edits are still blocked
-- This ensures admins can properly update pricing

-- Drop existing policies
DROP POLICY IF EXISTS "pricing_select_all" ON public.course_pricing;
DROP POLICY IF EXISTS "pricing_write_admin" ON public.course_pricing;
DROP POLICY IF EXISTS "pricing_insert_admin" ON public.course_pricing;
DROP POLICY IF EXISTS "pricing_update_admin" ON public.course_pricing;
DROP POLICY IF EXISTS "pricing_delete_admin" ON public.course_pricing;

-- Enable RLS (if not already enabled)
ALTER TABLE public.course_pricing ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view pricing (public information)
CREATE POLICY "pricing_select_all"
ON public.course_pricing
FOR SELECT
USING (true);

-- Policy 2: Only admins can INSERT new pricing
CREATE POLICY "pricing_insert_admin"
ON public.course_pricing
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: Only admins can UPDATE pricing
CREATE POLICY "pricing_update_admin"
ON public.course_pricing
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Only admins can DELETE pricing
CREATE POLICY "pricing_delete_admin"
ON public.course_pricing
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'course_pricing';
  
  RAISE NOTICE '✅ RLS Policies for course_pricing: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies created:';
  RAISE NOTICE '  1. pricing_select_all - Everyone can view pricing';
  RAISE NOTICE '  2. pricing_insert_admin - Admins can create pricing';
  RAISE NOTICE '  3. pricing_update_admin - Admins can update pricing';
  RAISE NOTICE '  4. pricing_delete_admin - Admins can delete pricing';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Admin pricing edits should now work!';
END $$;

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'course_pricing';
