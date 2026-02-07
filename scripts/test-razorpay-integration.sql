-- =====================================================
-- Razorpay Integration Testing & Verification Script
-- Purpose: Verify database schema and test subscription flow
-- Date: 2026-02-02
-- =====================================================

-- 1. Verify Tables Exist
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 1: Verifying Tables';
  RAISE NOTICE '========================================';
  
  -- Check profiles table has subscription fields
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'subscription_status'
  ) THEN
    RAISE NOTICE '✅ profiles.subscription_status exists';
  ELSE
    RAISE NOTICE '❌ profiles.subscription_status MISSING';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'subscription_end_date'
  ) THEN
    RAISE NOTICE '✅ profiles.subscription_end_date exists';
  ELSE
    RAISE NOTICE '❌ profiles.subscription_end_date MISSING';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'billing_cycle'
  ) THEN
    RAISE NOTICE '✅ profiles.billing_cycle exists';
  ELSE
    RAISE NOTICE '❌ profiles.billing_cycle MISSING';
  END IF;

  -- Check payments table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    RAISE NOTICE '✅ payments table exists';
  ELSE
    RAISE NOTICE '❌ payments table MISSING';
  END IF;
END $$;

-- 2. Verify Helper Functions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 2: Verifying Helper Functions';
  RAISE NOTICE '========================================';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_user_subscribed'
  ) THEN
    RAISE NOTICE '✅ is_user_subscribed() function exists';
  ELSE
    RAISE NOTICE '❌ is_user_subscribed() function MISSING';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_user_pro'
  ) THEN
    RAISE NOTICE '✅ is_user_pro() function exists';
  ELSE
    RAISE NOTICE '❌ is_user_pro() function MISSING';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_user_plus_or_higher'
  ) THEN
    RAISE NOTICE '✅ is_user_plus_or_higher() function exists';
  ELSE
    RAISE NOTICE '❌ is_user_plus_or_higher() function MISSING';
  END IF;
END $$;

-- 3. Verify RLS Policies
DO $$
DECLARE
  policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 3: Verifying RLS Policies';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
  AND tablename = 'payments';
  
  IF policy_count >= 2 THEN
    RAISE NOTICE '✅ RLS policies exist on payments table (% policies)', policy_count;
  ELSE
    RAISE NOTICE '❌ RLS policies MISSING on payments table';
  END IF;
END $$;

-- 4. Show Current Subscription Stats
DO $$
DECLARE
  total_users INT;
  free_users INT;
  plus_users INT;
  pro_users INT;
  active_subscriptions INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 4: Current Subscription Statistics';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  SELECT COUNT(*) INTO free_users 
  FROM public.profiles 
  WHERE subscription_plan = 'Free' OR subscription_plan IS NULL;
  
  SELECT COUNT(*) INTO plus_users 
  FROM public.profiles 
  WHERE subscription_plan = 'Plus';
  
  SELECT COUNT(*) INTO pro_users 
  FROM public.profiles 
  WHERE subscription_plan = 'Pro';
  
  SELECT COUNT(*) INTO active_subscriptions 
  FROM public.profiles 
  WHERE subscription_status = 'active'
  AND subscription_end_date > NOW();
  
  RAISE NOTICE 'Total Users: %', total_users;
  RAISE NOTICE 'Free Users: %', free_users;
  RAISE NOTICE 'Plus Users: %', plus_users;
  RAISE NOTICE 'Pro Users: %', pro_users;
  RAISE NOTICE 'Active Subscriptions: %', active_subscriptions;
END $$;

-- 5. Show Recent Payments
RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'STEP 5: Recent Payments (Last 10)';
RAISE NOTICE '========================================';

SELECT 
  p.id,
  p.plan_name,
  p.billing_cycle,
  p.amount,
  p.status,
  p.created_at,
  p.completed_at,
  CASE 
    WHEN p.razorpay_payment_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as "Payment ID",
  pr.email as user_email
FROM public.payments p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Show Active Subscriptions
RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'STEP 6: Active Subscriptions';
RAISE NOTICE '========================================';

SELECT 
  email,
  subscription_plan,
  subscription_status,
  billing_cycle,
  subscription_end_date,
  CASE 
    WHEN subscription_end_date > NOW() THEN '✅ Valid'
    WHEN subscription_end_date <= NOW() THEN '⚠️ Expired'
    ELSE '❌ No Date'
  END as validity,
  EXTRACT(DAY FROM (subscription_end_date - NOW())) as days_remaining
FROM public.profiles
WHERE subscription_status = 'active'
AND subscription_plan IN ('Plus', 'Pro')
ORDER BY subscription_end_date ASC;

-- 7. Test Helper Functions (if you have a test user)
-- REPLACE 'your-email@example.com' with actual email
DO $$
DECLARE
  test_user_id UUID;
  is_subscribed BOOLEAN;
  is_pro_check BOOLEAN;
  is_plus_check BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 7: Testing Helper Functions';
  RAISE NOTICE '========================================';
  
  -- Get a test user (replace with your email)
  SELECT id INTO test_user_id 
  FROM public.profiles 
  WHERE email = 'your-email@example.com' -- CHANGE THIS
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Test user not found (update email in script)';
  ELSE
    -- Test functions
    SELECT public.is_user_subscribed(test_user_id) INTO is_subscribed;
    SELECT public.is_user_pro(test_user_id) INTO is_pro_check;
    SELECT public.is_user_plus_or_higher(test_user_id) INTO is_plus_check;
    
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'is_user_subscribed(): %', is_subscribed;
    RAISE NOTICE 'is_user_pro(): %', is_pro_check;
    RAISE NOTICE 'is_user_plus_or_higher(): %', is_plus_check;
  END IF;
END $$;

-- 8. Check for Expired Subscriptions
RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'STEP 8: Expired Subscriptions Check';
RAISE NOTICE '========================================';

SELECT 
  COUNT(*) as expired_count,
  STRING_AGG(email, ', ') as expired_users
FROM public.profiles
WHERE subscription_status = 'active'
AND subscription_end_date IS NOT NULL
AND subscription_end_date <= NOW();

-- 9. Verify Indexes
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 9: Database Indexes';
  RAISE NOTICE '========================================';
  
  FOR rec IN 
    SELECT 
      tablename,
      indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('payments', 'profiles')
    AND indexname LIKE '%subscription%' OR indexname LIKE '%payment%'
    ORDER BY tablename, indexname
  LOOP
    RAISE NOTICE '✅ Index: %.%', rec.tablename, rec.indexname;
  END LOOP;
END $$;

-- 10. Final Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Review any ❌ MISSING items above';
  RAISE NOTICE '2. Run missing migrations if needed';
  RAISE NOTICE '3. Test payment flow on /upgrade page';
  RAISE NOTICE '4. Verify Razorpay keys in .env.local';
  RAISE NOTICE '5. Check webhook configuration';
  RAISE NOTICE '';
  RAISE NOTICE 'Documentation: RAZORPAY_INTEGRATION_COMPLETE.md';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Quick Test: Simulate a Payment (FOR TESTING ONLY)
-- =====================================================

-- UNCOMMENT BELOW TO TEST (Replace user_id with actual)
/*
INSERT INTO public.payments (
  user_id,
  razorpay_order_id,
  razorpay_payment_id,
  plan_name,
  billing_cycle,
  amount,
  currency,
  status,
  completed_at
) VALUES (
  'your-user-id-here', -- REPLACE THIS
  'test_order_' || gen_random_uuid(),
  'test_pay_' || gen_random_uuid(),
  'Plus',
  'MONTHLY',
  199,
  'INR',
  'completed',
  NOW()
);

UPDATE public.profiles
SET 
  subscription_plan = 'Plus',
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '30 days',
  billing_cycle = 'MONTHLY'
WHERE id = 'your-user-id-here'; -- REPLACE THIS

SELECT 'Test payment and subscription created!' as result;
*/
