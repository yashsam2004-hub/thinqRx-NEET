-- =====================================================
-- FIX RLS POLICY FOR SYLLABUS_OUTLINES (WITH CHECK)
-- =====================================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "syllabus_outlines_admin_all" ON public.syllabus_outlines;

-- Recreate with proper USING and WITH CHECK clauses
CREATE POLICY "syllabus_outlines_admin_all"
  ON public.syllabus_outlines
  FOR ALL
  TO authenticated
  USING (
    -- Allow reading if user is admin
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    -- Allow creating/updating if user is admin
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Add comment
COMMENT ON POLICY "syllabus_outlines_admin_all" ON public.syllabus_outlines IS 
  'Allow admins to perform all operations (SELECT, INSERT, UPDATE, DELETE) on syllabus_outlines';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'syllabus_outlines'
    AND policyname = 'syllabus_outlines_admin_all';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ syllabus_outlines_admin_all policy recreated successfully';
  ELSE
    RAISE WARNING '⚠️  Policy not found after creation';
  END IF;
  
  RAISE NOTICE 'Current RLS policies for syllabus_outlines:';
  FOR rec IN 
    SELECT policyname, cmd, 
           CASE WHEN qual IS NOT NULL THEN '✓' ELSE '✗' END as has_using,
           CASE WHEN with_check IS NOT NULL THEN '✓' ELSE '✗' END as has_with_check
    FROM pg_policies
    WHERE tablename = 'syllabus_outlines'
  LOOP
    RAISE NOTICE '  - %: % (USING: %, WITH CHECK: %)', 
      rec.policyname, rec.cmd, rec.has_using, rec.has_with_check;
  END LOOP;
END $$;
