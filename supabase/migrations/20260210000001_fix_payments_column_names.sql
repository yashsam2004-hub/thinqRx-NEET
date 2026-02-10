-- =====================================================
-- Fix Payments Table Schema - Handle Duplicate Columns
-- =====================================================
-- Issue: Both 'plan' and 'plan_name' columns existed
-- Solution: Drop old 'plan', keep 'plan_name', add defaults
-- =====================================================

-- Step 1: Drop the old 'plan' column if it exists (plan_name already exists)
ALTER TABLE public.payments 
  DROP COLUMN IF EXISTS plan CASCADE;

-- Step 2: Ensure plan_name is NOT NULL with default
ALTER TABLE public.payments 
  ALTER COLUMN plan_name SET DEFAULT 'Free';

-- Fill any NULL values in plan_name
UPDATE public.payments 
SET plan_name = 'Free' 
WHERE plan_name IS NULL;

ALTER TABLE public.payments 
  ALTER COLUMN plan_name SET NOT NULL;

-- Step 3: Ensure amount has default
ALTER TABLE public.payments 
  ALTER COLUMN amount SET DEFAULT 0;

-- Fill any NULL amounts
UPDATE public.payments 
SET amount = 0 
WHERE amount IS NULL;

-- Step 4: Ensure status has default
ALTER TABLE public.payments 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Fill any NULL statuses
UPDATE public.payments 
SET status = 'pending' 
WHERE status IS NULL;

-- Step 5: Add/recreate check constraints
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_plan_name_check;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_plan_name_check 
  CHECK (plan_name IN ('PLUS', 'PRO', 'Free'));

ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Verify the migration
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Payments Table Schema After Fix ===';
  
  FOR rec IN 
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'payments'
      AND column_name IN ('plan_name', 'amount', 'status', 'currency')
    ORDER BY column_name
  LOOP
    RAISE NOTICE 'Column: %, Nullable: %, Default: %', 
      rec.column_name, rec.is_nullable, rec.column_default;
  END LOOP;
  
  RAISE NOTICE '✅ Schema fixed: Old plan column removed, defaults added';
END $$;
