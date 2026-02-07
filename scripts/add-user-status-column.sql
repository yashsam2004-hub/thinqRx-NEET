-- ============================================
-- ADD USER STATUS COLUMN FOR BLOCKING
-- ============================================
-- Add status column to profiles table
-- Allows admins to block/unblock users

-- 1. Add status column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'blocked', 'suspended'));

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 3. Set all existing users to active
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

-- 4. Add comment
COMMENT ON COLUMN public.profiles.status IS 
  'User account status: active, blocked, or suspended. Blocked users cannot access the platform.';

-- 5. Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND status = 'blocked'
  );
END;
$$;

-- 6. Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION public.is_user_blocked IS 'Check if a user account is blocked';
COMMENT ON FUNCTION public.is_user_active IS 'Check if a user account is active';

-- 7. Verify changes
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'active') as active_users,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_users,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users
FROM public.profiles;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User status column added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Status options:';
  RAISE NOTICE '  • active: Normal user (can access all features)';
  RAISE NOTICE '  • blocked: Blocked user (cannot login/access)';
  RAISE NOTICE '  • suspended: Temporarily suspended';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Admins can now block/unblock users in /admin/users';
END $$;
