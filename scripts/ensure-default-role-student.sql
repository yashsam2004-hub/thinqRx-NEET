-- ============================================
-- ENSURE NEW USERS GET 'student' ROLE (NEVER admin)
-- ============================================
-- This script ensures that:
-- 1. The profiles table only allows 'student' and 'admin' roles
-- 2. Default role is 'student'
-- 3. Database trigger creates profiles with 'student' role
-- 4. Admin role must be manually set in Supabase
-- ============================================

-- ============================================
-- 1. Verify/Update profiles table schema
-- ============================================

-- Ensure role column has correct check constraint
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  
  -- Add check constraint allowing only 'student' and 'admin'
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'admin'));
  
  -- Set default to 'student'
  ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'student';
  
  -- Ensure role is NOT NULL
  ALTER TABLE public.profiles 
  ALTER COLUMN role SET NOT NULL;
END $$;

-- ============================================
-- 2. Update/Create handle_new_user trigger function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Always create new users with 'student' role
  -- Admin role MUST be manually set in Supabase
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'student', -- EXPLICIT: New users are always students, never admins
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- 3. Recreate trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. Verify existing users don't have invalid roles
-- ============================================

-- Check for any users with invalid roles
SELECT 
  id, 
  email, 
  role,
  created_at
FROM public.profiles
WHERE role NOT IN ('student', 'admin')
ORDER BY created_at DESC;

-- If you find any, you can fix them:
-- UPDATE public.profiles SET role = 'student' WHERE role NOT IN ('student', 'admin');

-- ============================================
-- 5. Verify the setup
-- ============================================

-- Check default value
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'role';

-- Check constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_role_check';

-- Check trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Count users by role
SELECT 
  role,
  COUNT(*) AS user_count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.profiles.role IS 
  'User role: student (default for new users) or admin (must be set manually). New signups always get student role.';

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile with student role when a new user signs up. Admin role must be manually assigned.';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Setup complete!';
  RAISE NOTICE 'New users will automatically get "student" role.';
  RAISE NOTICE 'To make someone an admin, manually update in Supabase:';
  RAISE NOTICE 'UPDATE profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
END $$;
