# 🚨 Fix QR Payment Issue - URGENT

## The Problem
Users pay via QR code (UPI) but the payment doesn't update in the app.

## Root Cause
**Razorpay webhooks are NOT configured!** Without webhooks, QR payments never notify our server.

---

## ✅ Solution Deployed

I've just deployed 2 fixes:

### 1. **Auto-Polling** (Frontend Fix) ✅
- Frontend now polls Razorpay every 3 seconds after showing QR
- Automatically detects when payment is completed
- Triggers verification without user action

### 2. **Payment Status API** (Backend Fix) ✅
- New endpoint: `/api/payments/status?order_id=xxx`
- Checks Razorpay directly for payment status
- Used by the auto-polling feature

**These are now LIVE after the latest push!**

---

## 🔴 CRITICAL: Configure Webhooks (5 minutes)

Even with auto-polling, webhooks are ESSENTIAL for:
- Payments made when user closes the page
- Backup verification
- Production-grade reliability

### Steps:

1. **Open Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com
   - Switch to **LIVE MODE** (top right corner)

2. **Go to Webhooks**
   - Settings → Webhooks
   - Click "Create New Webhook"

3. **Configure Webhook**
   ```
   Webhook URL: https://www.thinqrx.in/api/webhooks/razorpay
   
   Active Events (select these 3):
   ✅ payment.captured
   ✅ payment.failed
   ✅ order.paid
   
   Secret: [will be generated - copy this!]
   ```

4. **Save Secret to Vercel**
   - Copy the webhook secret from Razorpay
   - Go to Vercel → thinqrx → Settings → Environment Variables
   - Add new variable:
     ```
     Name: RAZORPAY_WEBHOOK_SECRET
     Value: [paste the secret from step 3]
     Environment: Production
     ```
   - Click "Save"

5. **Redeploy** (Vercel will auto-deploy, or trigger manually)

---

## 🧪 Test the Fix

### Test Case 1: New QR Payment (Auto-Polling)
1. Go to https://www.thinqrx.in/upgrade
2. Select a plan
3. Click "Proceed to Payment"
4. Choose UPI → QR Code
5. **Don't close the page!**
6. Scan and pay with any UPI app
7. **Expected:** Within 5-10 seconds, you'll see "Payment successful!"
8. Dashboard should show the new plan

### Test Case 2: Webhook Verification
1. Make a test payment
2. Go to Razorpay Dashboard → Webhooks → View Logs
3. Check if webhook was sent successfully
4. Check response status (should be 200 OK)

---

## 🆘 Fix Stuck Payment Manually

If a user already paid but it's not showing:

### Find Payment Details:
1. **Razorpay Dashboard** → Payments
2. Find the payment (search by amount or user)
3. Note: `Payment ID` and `Order ID`

### Find User:
1. **Supabase** → Table Editor → `profiles`
2. Search by email
3. Copy user's `id` (UUID)

### Run SQL Fix:
```sql
-- Paste in Supabase SQL Editor
DO $$ 
DECLARE
  v_user_id UUID := 'USER_UUID_HERE';
  v_payment_id TEXT := 'pay_xxxxx'; -- from Razorpay
  v_order_id TEXT := 'order_xxxxx'; -- from Razorpay
  v_plan_id TEXT := 'gpat_last_minute'; -- plan they purchased
  v_amount NUMERIC := 199; -- amount in INR
  v_validity_days INT;
  v_valid_until TIMESTAMPTZ;
BEGIN
  -- Get plan validity
  SELECT validity_days INTO v_validity_days
  FROM plans WHERE id = v_plan_id;
  
  v_valid_until := NOW() + (v_validity_days || ' days')::INTERVAL;
  
  -- Create/update payment
  INSERT INTO payments (
    user_id, razorpay_order_id, razorpay_payment_id,
    plan_name, billing_cycle, amount, currency,
    status, completed_at, created_at
  ) VALUES (
    v_user_id, v_order_id, v_payment_id,
    v_plan_id, 'ONE_TIME', v_amount, 'INR',
    'completed', NOW(), NOW()
  )
  ON CONFLICT (razorpay_order_id) DO UPDATE SET
    razorpay_payment_id = v_payment_id,
    status = 'completed';
  
  -- Activate subscription
  PERFORM update_user_subscription(
    v_user_id, v_plan_id, 'ONE_TIME', v_valid_until
  );
  
  RAISE NOTICE 'FIXED! User: %, Plan: %, Valid until: %', 
    v_user_id, v_plan_id, v_valid_until;
END $$;
```

---

## 📊 Verify It's Working

After webhook configuration + deployment:

### Check Logs:
1. **Vercel Logs** → Real-time
2. Make a test payment
3. Look for:
   ```
   [Razorpay Webhook] ✅ Signature verified successfully
   [Razorpay Webhook] Payment captured: pay_xxxxx
   [Webhook] Subscription activated
   ```

### Check Database:
1. **Supabase** → Table Editor → `payments`
2. Find recent payment
3. Status should be `completed`
4. User's `profiles` → `subscription_status` should be `active`

---

## ✅ Deployment Checklist

- [x] Frontend auto-polling deployed
- [x] Payment status API deployed
- [ ] Razorpay webhooks configured (DO THIS NOW!)
- [ ] Webhook secret added to Vercel
- [ ] Test QR payment
- [ ] Check webhook logs in Razorpay
- [ ] Verify payment updates in database

---

## 📞 Still Not Working?

Check:
1. Vercel logs for errors
2. Razorpay webhook logs for failed attempts
3. Supabase logs for database errors
4. Browser console for frontend errors

**Contact for help:** info@thinqrx.in

---

**TIME TO FIX:** 5 minutes
**PRIORITY:** 🔴 CRITICAL
**STATUS:** Code deployed, webhook setup required
