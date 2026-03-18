# ⚡ Razorpay Integration - Quick Start Guide

**Get up and running in 10 minutes!**

---

## 🎯 Overview

Your SynoRx app now has **complete Razorpay payment integration**. This guide will help you test it locally and deploy to production.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Razorpay Keys

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Sign up / Log in
3. Go to **Settings** → **API Keys**
4. Click **"Generate Test Keys"**
5. Copy:
   - `Key ID` (starts with `rzp_test_`)
   - `Key Secret`

### Step 2: Add to Environment

Create/update `.env.local` in project root:

```env
# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=any_random_string_for_testing
```

### Step 3: Run Database Migration

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** → **New Query**
3. Copy & paste: `supabase/migrations/20260202000003_add_subscription_fields.sql`
4. Click **Run**
5. Should see: ✅ "Subscription & Payment schema setup complete!"

---

## 🧪 Test Payment (5 Minutes)

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Navigate to Upgrade Page

Open: `http://localhost:3000/upgrade`

### 3. Select Plan & Pay

- Choose **Pro** plan
- Select **Monthly** billing
- Click **"Proceed to Secure Payment"**

### 4. Razorpay Modal Opens

- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date (e.g., `12/27`)
- Click **Pay**

### 5. Verify Success

- Toast notification: ✅ "Payment successful!"
- Redirects to `/dashboard`
- Premium content unlocked

### 6. Check Database

**Supabase → Table Editor → profiles**

Your user should now have:
```
subscription_plan: "Pro"
subscription_status: "active"
subscription_end_date: 30 days from now
billing_cycle: "MONTHLY"
```

**Supabase → Table Editor → payments**

Should see a new payment with:
```
status: "completed"
razorpay_payment_id: "pay_xxxxx"
amount: 299
```

---

## ✅ Verification Checklist

Run this to verify everything is set up:

```sql
-- In Supabase SQL Editor
-- Copy from: scripts/test-razorpay-integration.sql
```

Should see:
- ✅ All tables exist
- ✅ All helper functions exist
- ✅ RLS policies active
- ✅ Your test payment visible

---

## 🌐 Production Deployment

### 1. Switch to Live Keys

**Razorpay Dashboard** → **Settings** → **API Keys** → **Generate Live Keys**

### 2. Set Webhook

**Razorpay Dashboard** → **Settings** → **Webhooks** → **Add New Webhook**

```
URL: https://yourdomain.com/api/webhooks/razorpay
Events: ✅ payment.captured, ✅ payment.failed
```

Copy the **Webhook Secret**

### 3. Update Environment (Vercel)

**Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

### 4. Deploy

```bash
git add .
git commit -m "Add Razorpay payment integration"
git push origin main
```

### 5. Test in Production

- Use a **real card** (small amount)
- Or use Razorpay test mode in production (if enabled)

---

## 🎮 How to Use in Code

### Protect Premium Content

```typescript
import { PremiumGuard } from '@/components/PremiumGuard';

<PremiumGuard requiredPlan="Pro">
  <YourPremiumComponent />
</PremiumGuard>
```

### Check Subscription Status

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext';

function MyComponent() {
  const { isPro, isPlus, subscription } = useSubscription();

  if (isPro) {
    return <PremiumFeature />;
  }
  
  return <FreeFeature />;
}
```

### Trigger Payment

Already implemented in `/upgrade` page!

---

## 📊 Admin View

### View Payments

```sql
-- In Supabase SQL Editor
SELECT 
  p.plan_name,
  p.amount,
  p.status,
  p.created_at,
  pr.email
FROM payments p
JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;
```

### View Active Subscriptions

```sql
SELECT 
  email,
  subscription_plan,
  subscription_end_date,
  billing_cycle
FROM profiles
WHERE subscription_status = 'active'
ORDER BY subscription_end_date;
```

---

## 🐛 Troubleshooting

### "Payment gateway not configured"
**Fix**: Check `.env.local` has all Razorpay keys

### "Failed to load payment gateway"
**Fix**: Check internet connection, try different browser

### "Payment verification failed"
**Fix**: Verify `RAZORPAY_KEY_SECRET` matches dashboard

### Subscription not activated
**Fix**: Check server logs in terminal, verify service role key

---

## 📚 Full Documentation

- **Complete Guide**: `RAZORPAY_INTEGRATION_COMPLETE.md` (30+ pages)
- **Summary**: `RAZORPAY_INTEGRATION_SUMMARY.md`
- **Testing Script**: `scripts/test-razorpay-integration.sql`

---

## 🎉 You're Done!

That's it! Your payment system is:

✅ Fully integrated  
✅ Production-ready  
✅ Secure  
✅ Tested  

**Start accepting payments! 🚀**

---

**Need Help?**

1. Check `RAZORPAY_INTEGRATION_COMPLETE.md` (comprehensive guide)
2. Run `scripts/test-razorpay-integration.sql` (verify setup)
3. Check Razorpay Dashboard for payment logs

---

**Built with ❤️ for SynoRx**

Last Updated: February 2, 2026
