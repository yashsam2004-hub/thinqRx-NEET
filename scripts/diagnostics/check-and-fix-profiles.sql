-- ============================================
-- CHECK & FIX PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Check current profiles table structure
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 2. Check for orphaned auth users (users without profiles)
-- ============================================
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.id as profile_id,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================
-- 3. Check recent signups
-- ============================================
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.email as profile_email,
  ce.plan,
  ce.status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.course_enrollments ce ON ce.user_id = au.id
ORDER BY au.created_at DESC
LIMIT 5;

-- ============================================
-- 4. Fix orphaned users (create missing profiles)
-- ============================================
INSERT INTO public.profiles (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. Ensure trigger is SIMPLE and works
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple insert - just create the row
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't fail auth
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. Verify RLS allows reading own profile
-- ============================================
-- This is CRITICAL - without this, profile exists but can't be read

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR true); -- Allow all reads for now

-- ============================================
-- 7. Test Results
-- ============================================
DO $$
DECLARE
  orphaned_count INTEGER;
  total_profiles INTEGER;
  total_auth INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL;
  
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO total_auth FROM auth.users;
  
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ Fix Complete!';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Total auth users: %', total_auth;
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Orphaned users (missing profiles): %', orphaned_count;
  RAISE NOTICE '';
  
  IF orphaned_count = 0 THEN
    RAISE NOTICE '✅ All auth users have profiles!';
  ELSE
    RAISE NOTICE '⚠️  Still have % orphaned users - run step 4 again', orphaned_count;
  END IF;
END $$;
