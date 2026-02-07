-- Fix RLS policies for course_enrollments to allow signup
-- Users should be able to create their own enrollment during signup

-- Drop existing policies if any
DROP POLICY IF EXISTS "enrollments_select_own" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_admin" ON public.course_enrollments;

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own enrollments
CREATE POLICY "enrollments_select_own"
ON public.course_enrollments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Policy: Users can insert their own enrollment (for signup)
-- This is needed for the signup flow
CREATE POLICY "enrollments_insert_own"
ON public.course_enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Policy: Users can update their own enrollments (for plan changes)
CREATE POLICY "enrollments_update_own"
ON public.course_enrollments FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

-- Policy: Admin can do everything
CREATE POLICY "enrollments_admin"
ON public.course_enrollments FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update the trigger to be more specific
-- It should only check on INSERT, not UPDATE
DROP TRIGGER IF EXISTS enforce_one_course_per_user ON public.course_enrollments;
DROP FUNCTION IF EXISTS public.check_user_course_limit();

CREATE OR REPLACE FUNCTION public.check_user_course_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_count INTEGER;
BEGIN
  -- Only check on INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Count existing ACTIVE enrollments for this user
    SELECT COUNT(*)
    INTO v_enrollment_count
    FROM public.course_enrollments
    WHERE user_id = NEW.user_id
      AND status = 'active'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- If user already has an active enrollment, prevent new one
    IF v_enrollment_count > 0 THEN
      RAISE EXCEPTION 'User can only have one active course enrollment. Email support@thinqrx.com to change courses.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER enforce_one_course_per_user
  BEFORE INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_course_limit();

-- Add comment
COMMENT ON FUNCTION public.check_user_course_limit() IS 'Ensures each user can only have one active course enrollment';
