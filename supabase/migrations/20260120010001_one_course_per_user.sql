-- Enforce one course per user at database level
-- Add unique constraint to ensure one enrollment per user (across all courses)

-- First, let's create a function to check if user already has an enrollment
CREATE OR REPLACE FUNCTION public.check_user_course_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_count INTEGER;
BEGIN
  -- Count existing enrollments for this user
  SELECT COUNT(*)
  INTO v_enrollment_count
  FROM public.course_enrollments
  WHERE user_id = NEW.user_id;

  -- If user already has an enrollment, prevent new one
  IF v_enrollment_count > 0 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'User can only enroll in one course. Email support to change courses.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce the rule
DROP TRIGGER IF EXISTS enforce_one_course_per_user ON public.course_enrollments;
CREATE TRIGGER enforce_one_course_per_user
  BEFORE INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_course_limit();

-- Add comment explaining the constraint
COMMENT ON FUNCTION public.check_user_course_limit() IS 'Ensures each user can only enroll in one course';
