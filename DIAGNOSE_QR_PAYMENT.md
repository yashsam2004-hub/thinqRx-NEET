# QR Payment Not Updated - Diagnostic Guide

## The Problem
When users pay via QR code (UPI), the payment is successful in Razorpay but not reflected in the app.

## Root Causes

### 1. **Webhook Not Configured** (Most Likely)
Razorpay needs to send a webhook to your server when payment is captured.

**Check:**
- Go to Razorpay Dashboard → Settings → Webhooks
- Verify webhook URL is set to: `https://www.thinqrx.in/api/webhooks/razorpay`
- Verify these events are enabled:
  - ✅ `payment.captured`
  - ✅ `payment.failed`
  - ✅ `order.paid`

**Fix:**
1. Add webhook URL: `https://www.thinqrx.in/api/webhooks/razorpay`
2. Copy the **Webhook Secret** shown
3. Add to Vercel environment variables:
   - Name: `RAZORPAY_WEBHOOK_SECRET`
   - Value: [paste the secret from Razorpay]
4. Redeploy the app

---

### 2. **Test vs Live Mode Mismatch**
**Check:**
- Razorpay Dashboard → Top right corner → Is it in "Test Mode" or "Live Mode"?
- Your environment variables → Is `NEXT_PUBLIC_RAZORPAY_KEY_ID` for Test or Live?

**Test mode key starts with:** `rzp_test_`
**Live mode key starts with:** `rzp_live_`

**Fix:** Ensure both dashboard and app are in the same mode (Live for production).

---

### 3. **Missing Frontend Polling**
After QR payment, the frontend should poll Razorpay to check payment status.

**Check:** Does the upgrade page have this logic?

---

## Immediate Fix for Stuck Payment

If a user has already paid but it's not updated:

### Step 1: Find the Payment in Razorpay
1. Go to Razorpay Dashboard → Payments
2. Search for recent payment by amount or UPI ID
3. Copy the **Payment ID** (e.g., `pay_xxxxx`)
4. Copy the **Order ID** (e.g., `order_xxxxx`)

### Step 2: Find the User in Supabase
1. Go to Supabase → Table Editor → `profiles`
2. Search for user by email
3. Copy their `id` (UUID)

### Step 3: Run This SQL in Supabase SQL Editor

```sql
-- Replace these values
DO $$ 
DECLARE
  v_user_id UUID := 'PASTE_USER_UUID_HERE';
  v_payment_id TEXT := 'pay_xxxxx'; -- from Razorpay
  v_order_id TEXT := 'order_xxxxx'; -- from Razorpay
  v_plan_id TEXT := 'gpat_last_minute'; -- or 'plus' or 'pro'
  v_amount NUMERIC := 199; -- payment amount in INR
  v_validity_days INT;
  v_valid_until TIMESTAMPTZ;
BEGIN
  -- Get plan validity
  SELECT validity_days INTO v_validity_days
  FROM plans
  WHERE id = v_plan_id;
  
  IF v_validity_days IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', v_plan_id;
  END IF;
  
  v_valid_until := NOW() + (v_validity_days || ' days')::INTERVAL;
  
  -- Insert or update payment record
  INSERT INTO payments (
    user_id,
    razorpay_order_id,
    razorpay_payment_id,
    plan_name,
    billing_cycle,
    amount,
    currency,
    status,
    completed_at,
    created_at
  ) VALUES (
    v_user_id,
    v_order_id,
    v_payment_id,
    v_plan_id,
    'ONE_TIME',
    v_amount,
    'INR',
    'completed',
    NOW(),
    NOW()
  )
  ON CONFLICT (razorpay_order_id) 
  DO UPDATE SET
    razorpay_payment_id = v_payment_id,
    status = 'completed',
    completed_at = NOW();
  
  -- Activate subscription
  PERFORM update_user_subscription(
    v_user_id,
    v_plan_id,
    'ONE_TIME',
    v_valid_until
  );
  
  RAISE NOTICE 'Payment fixed! User: %, Plan: %, Valid until: %', 
    v_user_id, v_plan_id, v_valid_until;
END $$;
```

---

## Long-Term Solution

### 1. Configure Webhooks (Critical)
Without webhooks, QR payments will NEVER auto-update.

### 2. Add Frontend Payment Status Polling
The upgrade page should poll Razorpay every 3-5 seconds after showing QR:

```typescript
// After creating order, poll for payment status
const checkPaymentStatus = async (orderId: string) => {
  const response = await fetch(`/api/payments/status?order_id=${orderId}`);
  const data = await response.json();
  
  if (data.status === 'paid') {
    // Payment successful, verify it
    await verifyPayment(data.payment_id, data.order_id, data.signature);
  }
};

// Poll every 5 seconds for 10 minutes
const pollInterval = setInterval(() => {
  checkPaymentStatus(orderId);
}, 5000);
```

### 3. Create Payment Status Check API

```typescript
// src/app/api/payments/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id');
  
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  
  const payments = await razorpay.orders.fetchPayments(orderId);
  const payment = payments.items[0];
  
  if (payment && payment.status === 'captured') {
    return NextResponse.json({
      status: 'paid',
      payment_id: payment.id,
      order_id: orderId,
      signature: '...' // Generate signature if needed
    });
  }
  
  return NextResponse.json({ status: 'pending' });
}
```

---

## Testing Checklist

- [ ] Webhook URL configured in Razorpay
- [ ] Webhook secret added to Vercel env
- [ ] Test/Live mode matches in Razorpay and app
- [ ] Make a test QR payment (₹1)
- [ ] Check Vercel logs for webhook calls
- [ ] Verify payment updates in database within 5 seconds

---

## Contact Support

If issue persists, collect:
1. Payment ID from Razorpay
2. Order ID from Razorpay
3. User email
4. Timestamp of payment
5. Screenshot of Razorpay payment details

Send to: info@thinqrx.in
