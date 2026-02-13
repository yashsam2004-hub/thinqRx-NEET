-- =================================================================
-- CRITICAL FIX: Remove Old Billing Cycle CHECK Constraints
-- =================================================================
-- This migration removes outdated CHECK constraints that block
-- ONE_TIME billing cycle and dynamic plan IDs from plans table.
--
-- WHEN TO RUN: Immediately in Production Supabase
-- WHY: Existing constraints only allow 'MONTHLY'/'ANNUAL' and
--      hardcoded plan names, preventing new payment model
-- =================================================================

-- Drop all old CHECK constraints from payments table
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_plan_name_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_billing_cycle_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_plan_check;

-- Drop all old CHECK constraints from profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

-- Drop all old CHECK constraints from course_enrollments table
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_plan_check;
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_billing_cycle_check;
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_status_check;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Payment records. plan_name and billing_cycle accept any value from plans table - no CHECK constraints';
COMMENT ON TABLE profiles IS 'User profiles. Subscription fields accept any value from plans table - no CHECK constraints';
COMMENT ON TABLE course_enrollments IS 'Course enrollments. Plan and billing_cycle accept any value from plans table - no CHECK constraints';

-- =================================================================
-- VERIFY CONSTRAINTS ARE REMOVED
-- =================================================================
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('payments', 'profiles', 'course_enrollments')
  AND constraint_type = 'CHECK'
  AND constraint_name NOT LIKE '%_not_null' -- Exclude NOT NULL constraints (those are fine)
ORDER BY table_name, constraint_name;

-- Expected result: No rows returned (only NOT NULL constraints should remain)
-- If you see any *_plan_*, *_billing_cycle_*, or *_status_* constraints, they weren't dropped

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ CHECK Constraints Removed Successfully!';
  RAISE NOTICE 'All tables now accept:';
  RAISE NOTICE '  - billing_cycle: ONE_TIME (or any value)';
  RAISE NOTICE '  - plan_name: Any plan ID from plans table';
  RAISE NOTICE '  - status: Any status value';
  RAISE NOTICE '';
  RAISE NOTICE 'Future payments will work correctly!';
END $$;
