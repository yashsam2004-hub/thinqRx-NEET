-- =====================================================
-- FIX CRITICAL SUPABASE SECURITY WARNINGS
-- =====================================================
-- This migration fixes:
-- 1. RLS policies that reference user metadata (CRITICAL)
-- 2. SECURITY DEFINER views (CRITICAL)
--
-- Strategy:
-- - Replace auth.users metadata checks with stable profiles table
-- - Use EXISTS subqueries to check role from profiles
-- - Remove SECURITY DEFINER from views
-- - All policies use ONLY auth.uid() and stable table references
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: course_enrollments RLS policies
-- =====================================================
-- Drop all problematic admin policies that reference user metadata
DROP POLICY IF EXISTS admin_delete_enrollments ON public.course_enrollments;
DROP POLICY IF EXISTS admin_insert_enrollments ON public.course_enrollments;
DROP POLICY IF EXISTS admin_read_all_enrollments ON public.course_enrollments;
DROP POLICY IF EXISTS admin_update_enrollments ON public.course_enrollments;

-- Create secure admin policies using profiles.role check
-- Admin can read all enrollments
CREATE POLICY admin_read_all_enrollments ON public.course_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert any enrollment
CREATE POLICY admin_insert_enrollments ON public.course_enrollments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any enrollment
CREATE POLICY admin_update_enrollments ON public.course_enrollments
  FOR UPDATE
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

-- Admin can delete any enrollment
CREATE POLICY admin_delete_enrollments ON public.course_enrollments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FIX 2: user_attempts RLS policies
-- =====================================================
-- Drop problematic admin policy that references user metadata
DROP POLICY IF EXISTS attempts_read_admin ON public.user_attempts;

-- Create secure admin policy using profiles.role check
CREATE POLICY attempts_read_admin ON public.user_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FIX 3: Remove SECURITY DEFINER from user_course_access view
-- =====================================================
-- Drop the SECURITY DEFINER view
DROP VIEW IF EXISTS public.user_course_access;

-- Recreate as a standard view that respects RLS
-- This view shows course access for the current authenticated user only
CREATE VIEW public.user_course_access AS
SELECT 
  ce.id AS enrollment_id,
  ce.user_id,
  ce.course_id,
  ce.plan,
  ce.status,
  ce.valid_until,
  ce.created_at,
  c.name AS course_name,
  c.code AS course_code,
  c.is_active AS course_is_active
FROM public.course_enrollments ce
JOIN public.courses c ON c.id = ce.course_id
WHERE ce.user_id = auth.uid()
  AND ce.status = 'active'
  AND c.is_active = true;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.user_course_access TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.user_course_access IS 
'Shows active course enrollments for the currently authenticated user only. No SECURITY DEFINER - respects RLS.';

-- =====================================================
-- VERIFICATION: Check all policies are correct
-- =====================================================
-- All policies should now:
-- 1. Use ONLY auth.uid() or EXISTS with profiles table
-- 2. Never reference auth.users, auth.jwt(), or user metadata
-- 3. Have proper USING and WITH CHECK clauses
-- =====================================================

COMMIT;
