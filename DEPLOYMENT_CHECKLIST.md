# 🚀 DEPLOYMENT CHECKLIST

## ✅ Code Deployment (COMPLETED)
- [x] Code committed to Git
- [x] Pushed to GitHub (commit: ea34709)
- [x] Vercel automatic deployment triggered

**Status**: Vercel is now building and deploying the updated code automatically.

---

## 📊 Database Migrations (ACTION REQUIRED)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click on "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Run Migration Scripts

Open the file: `SUPABASE_DEPLOYMENT_SCRIPT.sql` 

Execute each section in order:

#### Migration 1: Remove CHECK Constraints (Required First)
```sql
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_plan_check;
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_billing_cycle_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;
```
✅ Expected result: "Query returned successfully"

#### Migration 2: Update RPC Function (Required Second)
Copy and paste the entire `CREATE OR REPLACE FUNCTION public.update_user_subscription` block from the deployment script.

✅ Expected result: "Query returned successfully"

#### Migration 3: Fix pskiran4u User (Manual Fix)
1. Run: `SELECT id, email FROM auth.users WHERE email = 'pskiran4u@gmail.com';`
2. Copy the UUID from the result
3. Replace `PASTE_UUID_HERE` in Step 3B of the deployment script
4. Execute the DO block

✅ Expected result: "Subscription activated successfully for user..."

---

## 🧪 Verification Steps

### 1. Check Vercel Deployment
Visit: https://vercel.com/your-project/deployments
- Deployment should show "Ready" status
- Latest commit: ea34709

### 2. Verify Database Changes
Run these queries in Supabase SQL Editor:

```sql
-- Check pskiran4u status
SELECT 
  au.email,
  p.subscription_plan,
  p.subscription_status,
  ce.plan,
  ce.status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN course_enrollments ce ON p.id = ce.user_id
WHERE au.email = 'pskiran4u@gmail.com';
```

Expected: Plan = `gpat_last_minute`, Status = `active`

### 3. Test New Payment Flow
1. Try purchasing an exam pack (test mode)
2. Complete payment
3. Verify subscription activates correctly
4. Check admin panel shows the purchase

---

## 📋 Quick Reference

### What Changed:
- ✅ Plan IDs now stored consistently (lowercase, as-is from database)
- ✅ CHECK constraints removed (database accepts dynamic plans)
- ✅ RPC function simplified (no case conversions)
- ✅ Premium access logic updated (recognizes exam packs)

### Files Modified:
- `src/app/api/payments/create-order/route.ts`
- `src/lib/enrollments/index.ts`

### New Migrations:
- `20260213000000_remove_plan_check_constraints.sql`
- `20260213000001_simplify_update_subscription_rpc.sql`

---

## 🆘 Troubleshooting

### If Vercel build fails:
1. Check Vercel logs: https://vercel.com/your-project/deployments
2. Look for error messages
3. Report back any TypeScript or build errors

### If migration fails:
1. Check which constraint is blocking
2. Verify constraint names: `\d+ course_enrollments` in Supabase
3. Share error message for troubleshooting

### If pskiran4u fix fails:
1. Verify UUID is correct (36 characters with hyphens)
2. Check if user exists in auth.users table
3. Check for any foreign key violations

---

## ✅ Deployment Complete When:
- [ ] Vercel shows "Ready" status
- [ ] Migration 1 executed successfully
- [ ] Migration 2 executed successfully
- [ ] Migration 3 executed (pskiran4u fixed)
- [ ] Verification queries return expected results
- [ ] Test payment completes successfully

---

**Current Status**: 
- Code: ✅ Deployed to GitHub
- Vercel: 🔄 Deploying automatically
- Database: ⏳ Waiting for you to run migrations

**Next Action**: Open Supabase SQL Editor and execute the deployment script!
