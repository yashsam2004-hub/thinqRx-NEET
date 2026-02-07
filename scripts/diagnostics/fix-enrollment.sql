-- Fix Enrollment Issues
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Ensure RLS is properly configured
-- ============================================

-- Disable RLS temporarily for testing (IMPORTANT: Re-enable after testing)
-- ALTER TABLE course_enrollments DISABLE ROW LEVEL SECURITY;

-- Or better: Fix RLS policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Service role can manage all enrollments" ON course_enrollments;

-- Allow users to view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON course_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can manage all enrollments"
ON course_enrollments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 2. Create stored procedure for enrollment
-- ============================================

CREATE OR REPLACE FUNCTION create_course_enrollment(
  p_user_id UUID,
  p_course_id UUID,
  p_plan TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_valid_until TIMESTAMPTZ;
  v_enrollment_id UUID;
  v_result JSON;
BEGIN
  -- Check if user already enrolled
  IF EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_ALREADY_ENROLLED',
      'message', 'User already has a course enrollment'
    );
  END IF;

  -- Check if profile exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PROFILE_NOT_FOUND',
      'message', 'User profile not found'
    );
  END IF;

  -- Check if course exists
  IF NOT EXISTS (
    SELECT 1 FROM courses WHERE id = p_course_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'COURSE_NOT_FOUND',
      'message', 'Course not found'
    );
  END IF;

  -- Calculate validity date
  -- UPDATED: All paid plans have 365 days validity
  IF p_plan = 'free' THEN
    v_valid_until := NULL;  -- Lifetime access for free plan
  ELSE
    v_valid_until := NOW() + INTERVAL '365 days';  -- 1 year for all paid plans
  END IF;

  -- Create enrollment
  INSERT INTO course_enrollments (
    user_id,
    course_id,
    plan,
    billing_cycle,
    status,
    valid_until
  ) VALUES (
    p_user_id,
    p_course_id,
    p_plan,
    p_billing_cycle,
    'active',
    v_valid_until
  )
  RETURNING id INTO v_enrollment_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id,
    'message', 'Enrollment created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_course_enrollment(UUID, UUID, TEXT, TEXT) TO authenticated, anon, service_role;

-- ============================================
-- 3. Fix profiles trigger (if needed)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. Test the function
-- ============================================

-- Example test (replace with actual IDs):
-- SELECT create_course_enrollment(
--   'user-uuid-here'::UUID,
--   'course-uuid-here'::UUID,
--   'free',
--   'monthly'
-- );

-- ============================================
-- 5. Verify setup
-- ============================================

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'course_enrollments';

-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_course_enrollment';

COMMIT;
