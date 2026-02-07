-- ============================================
-- Fix Profiles RLS for Admin Access
-- Date: 2026-02-02
-- Purpose: Ensure users can read their own profiles
-- ============================================

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;

-- Allow users to SELECT their own profile
CREATE POLICY profiles_select_own
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow admins to SELECT all profiles
CREATE POLICY profiles_select_admin
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
