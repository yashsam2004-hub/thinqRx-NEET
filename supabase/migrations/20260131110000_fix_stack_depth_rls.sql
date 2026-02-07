-- ============================================
-- Fix Stack Depth Issue in RLS Policies
-- Date: 2026-01-31
-- Purpose: Simplify RLS policies to avoid recursive checks
-- ============================================

-- First, ensure the is_admin function is simple and non-recursive
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role = 'admin' 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Drop all existing mock_tests policies
DROP POLICY IF EXISTS mock_tests_select_published ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_all ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_select ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_insert ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_update ON public.mock_tests;
DROP POLICY IF EXISTS mock_tests_admin_delete ON public.mock_tests;

-- Create separate, simple policies for each operation
-- Admin can SELECT
CREATE POLICY mock_tests_admin_select
ON public.mock_tests FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Admin can INSERT
CREATE POLICY mock_tests_admin_insert
ON public.mock_tests FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Admin can UPDATE
CREATE POLICY mock_tests_admin_update
ON public.mock_tests FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Admin can DELETE
CREATE POLICY mock_tests_admin_delete
ON public.mock_tests FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Regular users can SELECT published tests
CREATE POLICY mock_tests_select_published
ON public.mock_tests FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) != 'admin'
);

-- Ensure RLS is enabled
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
