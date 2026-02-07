-- ============================================
-- FINAL FIX: Remove Recursive Policies
-- ============================================

-- 1. Drop ALL policies that cause recursion
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- 2. Create SIMPLE policies without recursion
-- Users can SELECT their own profile (no recursion)
CREATE POLICY profiles_select_own
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can UPDATE their own profile (no recursion)
CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Done! No more infinite recursion!