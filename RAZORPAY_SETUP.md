# Razorpay Setup Guide for NEET Prep Platform

This guide walks you through setting up Razorpay payment integration for the NEET app.

## Prerequisites

- Active Razorpay account
- Admin access to Razorpay Dashboard
- `.env.local` file configured with Razorpay keys

## Step 1: Create Subscription Plans

Login to [Razorpay Dashboard](https://dashboard.razorpay.com) and navigate to **Subscriptions** → **Plans**.

### Plan 1: NEET Plus Monthly
- **Plan ID**: `neet-plus-monthly`
- **Plan Name**: NEET Plus (Monthly)
- **Billing Frequency**: Monthly
- **Billing Amount**: ₹199
- **Currency**: INR
- **Description**: Monthly subscription for NEET UG preparation with full access to study materials

### Plan 2: NEET Plus Annual
- **Plan ID**: `neet-plus-annual`
- **Plan Name**: NEET Plus (Annual)
- **Billing Frequency**: Yearly
- **Billing Amount**: ₹1,990 (₹199 × 10 months - 20% discount)
- **Currency**: INR
- **Description**: Annual subscription for NEET UG preparation (Save 20%)

### Plan 3: NEET Pro Monthly
- **Plan ID**: `neet-pro-monthly`
- **Plan Name**: NEET Pro (Monthly)
- **Billing Frequency**: Monthly
- **Billing Amount**: ₹299
- **Currency**: INR
- **Description**: Pro subscription with unlimited mock tests and advanced analytics

### Plan 4: NEET Pro Annual
- **Plan ID**: `neet-pro-annual`
- **Plan Name**: NEET Pro (Annual)
- **Billing Frequency**: Yearly
- **Billing Amount**: ₹2,990 (₹299 × 10 months - 20% discount)
- **Currency**: INR
- **Description**: Annual Pro subscription for NEET UG preparation (Save 20%)

## Step 2: Configure Webhook

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click **Create New Webhook**
3. Configure:
   - **Webhook URL**: `https://your-neet-domain.com/api/webhooks/razorpay`
   - **Alert Email**: Your admin email
   - **Active Events**: Select these events:
     - ✅ `subscription.charged`
     - ✅ `subscription.completed`
     - ✅ `subscription.cancelled`
     - ✅ `subscription.paused`
     - ✅ `subscription.resumed`
     - ✅ `payment.failed`
     - ✅ `payment.captured`

4. **Secret**: Copy the webhook secret and add to `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## Step 3: Test Mode Setup

For development/testing:

1. Switch to **Test Mode** in Razorpay Dashboard (top-left toggle)
2. Create test plans with same Plan IDs as above
3. Use test API keys in `.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   ```

### Test Cards

Use these test cards in Test Mode:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

## Step 4: Update Environment Variables

Update `D:\pharmcards-neet\.env.local`:

```env
# Razorpay (use same keys for both GPAT and NEET)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# App URL (update when deployed)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Step 5: Database Plans Configuration

After creating Razorpay plans, add them to your Supabase `plans` table:

```sql
-- Free Plan (no payment required)
INSERT INTO plans (id, name, display_name, billing_cycle, amount, currency, features, is_active, display_order)
VALUES (
  'free',
  'free',
  'Free Plan',
  'lifetime',
  0,
  'INR',
  '["Access to select free topics", "5 AI-generated notes per month", "Limited mock tests"]'::jsonb,
  true,
  1
);

-- Plus Monthly
INSERT INTO plans (id, name, display_name, billing_cycle, amount, currency, razorpay_plan_id, features, is_active, display_order)
VALUES (
  'plus-monthly',
  'plus',
  'NEET Plus (Monthly)',
  'monthly',
  19900, -- in paisa
  'INR',
  'neet-plus-monthly',
  '["Unlimited AI notes", "All subjects (Physics, Chemistry, Biology)", "10 full-length mock tests", "Basic analytics"]'::jsonb,
  true,
  2
);

-- Plus Annual
INSERT INTO plans (id, name, display_name, billing_cycle, amount, currency, razorpay_plan_id, features, is_active, display_order)
VALUES (
  'plus-annual',
  'plus',
  'NEET Plus (Annual)',
  'annual',
  199000, -- in paisa (₹1,990 - 20% discount)
  'INR',
  'neet-plus-annual',
  '["Unlimited AI notes", "All subjects (Physics, Chemistry, Biology)", "10 full-length mock tests", "Basic analytics", "Save 20% with annual billing"]'::jsonb,
  true,
  3
);

-- Pro Monthly
INSERT INTO plans (id, name, display_name, billing_cycle, amount, currency, razorpay_plan_id, features, is_active, display_order)
VALUES (
  'pro-monthly',
  'pro',
  'NEET Pro (Monthly)',
  'monthly',
  29900, -- in paisa
  'INR',
  'neet-pro-monthly',
  '["Everything in Plus", "Unlimited mock tests", "Advanced analytics with AI insights", "Previous year questions", "Priority support"]'::jsonb,
  true,
  4
);

-- Pro Annual
INSERT INTO plans (id, name, display_name, billing_cycle, amount, currency, razorpay_plan_id, features, is_active, display_order)
VALUES (
  'pro-annual',
  'pro',
  'NEET Pro (Annual)',
  'annual',
  299000, -- in paisa (₹2,990 - 20% discount)
  'INR',
  'neet-pro-annual',
  '["Everything in Plus", "Unlimited mock tests", "Advanced analytics with AI insights", "Previous year questions", "Priority support", "Save 20% with annual billing"]'::jsonb,
  true,
  5
);
```

## Step 6: Test Payment Flow

1. Start the NEET app: `npm run dev`
2. Navigate to http://localhost:3001/pricing
3. Click "Upgrade" on any paid plan
4. Complete test payment using test card
5. Verify:
   - ✅ Payment success redirect to dashboard
   - ✅ Subscription created in Razorpay
   - ✅ User enrollment created in database
   - ✅ User can access paid features

## Step 7: Verify Webhook

1. Make a test payment
2. Check Razorpay Dashboard → **Webhooks** → **Logs**
3. Verify webhook is receiving events successfully
4. Check your database `payments` table for payment record

## Step 8: Go Live

When ready for production:

1. Switch Razorpay to **Live Mode**
2. Create production plans (same Plan IDs)
3. Update webhook URL to production domain
4. Update `.env.local` with live API keys:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   ```
5. Deploy app to production
6. Test with real card (small amount first!)

## Troubleshooting

### Payment Not Processing

**Check:**
- Razorpay keys are correct in `.env.local`
- App is running on correct port (3001)
- Test mode matches (test keys → test plans)

### Webhook Not Receiving Events

**Check:**
- Webhook URL is publicly accessible (use ngrok for local testing)
- Webhook secret matches `.env.local`
- Events are selected in Razorpay webhook configuration

### Subscription Not Created in Database

**Check:**
- Database connection is working
- `course_enrollments` table exists
- RLS policies allow inserts
- Webhook handler is processing correctly

## Support

For Razorpay-specific issues:
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For NEET app issues:
- Check logs: `npm run dev` terminal output
- Check browser console for errors
- Review webhook logs in Razorpay Dashboard

## Security Checklist

Before going live:

- ✅ Webhook secret is set and kept secure
- ✅ API keys are in `.env.local` (not committed to git)
- ✅ `.env.local` is in `.gitignore`
- ✅ Payment verification is implemented
- ✅ HTTPS is enabled on production domain
- ✅ Webhook signature verification is working

---

**Note**: Same Razorpay account is used for both GPAT and NEET apps. Plans are differentiated by Plan IDs (`gpat-*` vs `neet-*`).
