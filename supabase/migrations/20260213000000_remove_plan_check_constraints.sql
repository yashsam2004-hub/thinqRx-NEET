-- Remove restrictive CHECK constraints to support dynamic plan IDs
-- This allows any plan ID from the plans table without hardcoded validation

-- Drop CHECK constraints on course_enrollments
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_plan_check;
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_billing_cycle_check;

-- Drop CHECK constraints on profiles  
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;

COMMENT ON TABLE course_enrollments IS 'Plan and billing_cycle now accept any value from plans table - no CHECK constraints';
COMMENT ON TABLE profiles IS 'Subscription fields now accept any value from plans table - no CHECK constraints';
