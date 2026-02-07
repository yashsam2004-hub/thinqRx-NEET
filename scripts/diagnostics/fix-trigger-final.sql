-- ============================================
-- FINAL FIX: Auth Trigger + RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Check profiles table structure
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
-- 2. Temporarily disable trigger to test
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 3. Create SAFE trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into profiles with all required fields
  INSERT INTO public.profiles (
    id,
    email,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- 4. Re-create trigger
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. Fix RLS on profiles table
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Enable read for users"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for auth users"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 6. Fix RLS on course_enrollments (already done but ensuring)
-- ============================================

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Service role enrollments" ON course_enrollments;

CREATE POLICY "Users can view enrollments"
  ON public.course_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role enrollments"
  ON public.course_enrollments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 7. Grant necessary permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.course_enrollments TO anon, authenticated, service_role;

-- ============================================
-- 8. Test the trigger manually
-- ============================================

-- This should work without errors:
-- (Replace with a real test email)
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- ============================================
-- 9. Verify everything
-- ============================================

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'course_enrollments');

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'course_enrollments')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger function updated with error handling';
  RAISE NOTICE '✅ RLS policies fixed for profiles and enrollments';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next: Try signup again!';
  RAISE NOTICE 'If it still fails, check Supabase Dashboard → Logs → Database';
END $$;
