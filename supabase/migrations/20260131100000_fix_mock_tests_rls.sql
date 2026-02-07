-- ============================================
-- Fix Mock Tests RLS Policies
-- Date: 2026-01-31
-- Purpose: Ensure admin users can access mock tests
-- ============================================

-- Recreate is_admin function to ensure it exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- Drop existing RLS policies for mock_tests
DROP POLICY IF EXISTS mock_tests_select_published ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_all ON public.mock_tests;

-- Recreate RLS policies with better error handling
-- Policy 1: Admins can do everything
CREATE POLICY mock_tests_admin_all
ON public.mock_tests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Regular users can only view published tests
CREATE POLICY mock_tests_select_published
ON public.mock_tests FOR SELECT
TO authenticated
USING (
  status = 'published'
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.mock_tests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
