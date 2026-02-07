-- ============================================
-- UPDATE PLAN VALIDITY TO 365 DAYS
-- ============================================
-- Run this in your Supabase SQL editor
-- 
-- Changes:
-- - All paid plans (Plus/Pro) now have 365 days validity
-- - Free plan remains lifetime (no expiry)
-- - Both monthly and annual billing cycles get 365 days

-- ============================================
-- 1. Update the Stored Procedure
-- ============================================

CREATE OR REPLACE FUNCTION create_course_enrollment(
  p_user_id UUID,
  p_course_id UUID,
  p_plan TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid_until TIMESTAMPTZ;
  v_enrollment_id UUID;
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

  -- UPDATED: Calculate validity date
  -- Free plan = lifetime (NULL)
  -- All paid plans (plus/pro) = 365 days (1 year) regardless of billing cycle
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_course_enrollment(UUID, UUID, TEXT, TEXT) TO authenticated, anon, service_role;

-- ============================================
-- 2. Update Existing Enrollments (Optional)
-- ============================================
-- OPTIONAL: Update existing monthly enrollments to have 365 days validity
-- Only affects active monthly enrollments that currently have 30-day validity

-- Uncomment the following if you want to update existing enrollments:

/*
UPDATE course_enrollments
SET 
  valid_until = created_at + INTERVAL '365 days',
  updated_at = NOW()
WHERE 
  plan IN ('plus', 'pro')  -- Only paid plans
  AND status = 'active'
  AND billing_cycle = 'monthly'
  AND valid_until IS NOT NULL
  AND valid_until < created_at + INTERVAL '365 days';  -- Only update if current validity is less than 365 days

-- Show updated records
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM course_enrollments
  WHERE 
    plan IN ('plus', 'pro')
    AND status = 'active'
    AND billing_cycle = 'monthly';
  
  RAISE NOTICE '✅ Updated % existing monthly enrollments to 365 days validity', updated_count;
END $$;
*/

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Stored procedure updated successfully!';
  RAISE NOTICE '✅ All paid plans now have 365 days validity';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Validity Rules:';
  RAISE NOTICE '   • Free plan: Lifetime (no expiry)';
  RAISE NOTICE '   • Plus plan: 365 days (1 year)';
  RAISE NOTICE '   • Pro plan: 365 days (1 year)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Note: This affects new enrollments.';
  RAISE NOTICE '💡 To update existing enrollments, uncomment section 2 above.';
END $$;
