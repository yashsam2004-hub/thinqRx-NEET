# 🚀 ThinqRx Deployment Checklist

## ✅ Recently Completed

### 1. **2-Device Limit Security** ✅
- Device fingerprinting implemented
- Auto-expiry of inactive devices (90 days)
- Admin device reset functionality
- User limit: 2 active devices max

### 2. **One-Time Payment Model** ✅
- Removed monthly/annual billing options
- All plans are now one-time purchases
- Validity determined by admin-set `validity_days` in plans table
- Billing cycle: `ONE_TIME` everywhere

### 3. **QR/UPI Payment Detection** ✅
- Auto-polling every 3 seconds
- Automatic payment verification
- Payment status API endpoint
- Webhook support ready

### 4. **Payment Flow Fixes** ✅
- Removed outdated CHECK constraints
- Fixed signature verification with API fallback
- Dynamic plan support from database
- Consistent validity calculation across all routes

---

## 🔴 CRITICAL: Database Migrations Required

### **Run These SQL Scripts in Supabase (IN ORDER):**

#### 1. Device Limit Table (Already Created?)
```bash
File: RUN_THIS_MIGRATION_NOW.sql
Status: ✅ Should be done (user_devices table)
```

Check if done:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_devices'
);
```

#### 2. Remove Old CHECK Constraints (CRITICAL!)
```bash
File: FIX_ONE_TIME_BILLING_PRODUCTION.sql
Status: ⚠️ MUST RUN NOW!
```

**This fixes the payment verification errors!**

Run in Supabase SQL Editor:
1. Open file `FIX_ONE_TIME_BILLING_PRODUCTION.sql`
2. Copy entire content
3. Paste in Supabase → SQL Editor
4. Execute
5. Verify no old constraints remain

---

## 🔧 Webhook Configuration (5 minutes)

### **Critical for QR/UPI Payments**

1. **Razorpay Dashboard** → Settings → Webhooks
2. Create new webhook:
   ```
   URL: https://www.thinqrx.in/api/webhooks/razorpay
   
   Events:
   ☑️ payment.captured
   ☑️ payment.failed
   ☑️ order.paid
   ```
3. Copy webhook secret
4. **Vercel** → Settings → Environment Variables:
   ```
   Name: RAZORPAY_WEBHOOK_SECRET
   Value: [paste secret]
   Environment: Production
   ```
5. Redeploy (auto-deploys on save)

---

## 🧪 Testing Checklist

### **Test 1: Device Limit**
- [ ] Login on browser 1 (Chrome)
- [ ] Login on browser 2 (Firefox)
- [ ] Try login on browser 3 → Should show device limit error
- [ ] Admin panel → Reset devices for user
- [ ] Login on browser 3 → Should work now

### **Test 2: Payment Flow**
- [ ] Select a plan on /upgrade
- [ ] Click "Proceed to Payment"
- [ ] Pay using UPI QR code
- [ ] Within 5-10 seconds, should auto-verify
- [ ] Dashboard shows correct plan
- [ ] Admin panel shows payment as "completed"
- [ ] Check validity matches plan's `validity_days`

### **Test 3: Webhook**
- [ ] Make a payment
- [ ] Razorpay Dashboard → Webhooks → Logs
- [ ] Should see webhook sent with 200 OK
- [ ] Vercel logs show: `[Razorpay Webhook] ✅ Signature verified`
- [ ] Payment updates in database automatically

### **Test 4: Database Constraints**
- [ ] Run verification query from `FIX_ONE_TIME_BILLING_PRODUCTION.sql`
- [ ] Should return no CHECK constraints (except NOT NULL)
- [ ] Make a test payment → Should succeed without constraint errors

---

## 📊 Monitoring

### **Vercel Logs to Watch:**
```
✅ [Razorpay] Order created: order_xxx, ₹199
✅ [Razorpay] Polling payment status
✅ [Razorpay] ✅ QR/UPI payment detected!
✅ [Razorpay] ✅ Signature verified successfully
✅ [Razorpay] Calculated validity from plan: 30 days
✅ [Verify] Subscription updated successfully via RPC
```

### **Webhook Logs to Watch:**
```
✅ [Razorpay Webhook] ✅ Signature verified successfully
✅ [Razorpay Webhook] Payment captured: pay_xxx
✅ [Razorpay Webhook] Calculated validity from plan
✅ [Webhook] Subscription activated
```

### **Error Patterns:**
```
❌ [Razorpay] Missing verification data → Check payment record creation
❌ ERROR: 23514 violates check constraint → Run FIX_ONE_TIME_BILLING_PRODUCTION.sql
❌ Device limit exceeded → Expected behavior, user needs device reset
❌ [Razorpay Webhook] Payment record not found → Payment wasn't inserted during order creation
```

---

## 🗂️ Environment Variables Checklist

### **Razorpay (Must Match Mode: Test or Live)**
- [x] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public key (starts with rzp_test_ or rzp_live_)
- [x] `RAZORPAY_KEY_ID` - Same as public key (for server)
- [x] `RAZORPAY_KEY_SECRET` - Secret key (for payment verification)
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Webhook secret (MUST ADD!)

### **Supabase**
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`

---

## 📁 Important Files Reference

### **SQL Scripts (Run in Supabase)**
- `RUN_THIS_MIGRATION_NOW.sql` - Device limit table
- `FIX_ONE_TIME_BILLING_PRODUCTION.sql` - Remove old CHECK constraints (CRITICAL!)
- `FIX_VALIDITY_PRODUCTION.sql` - Historical data fixes

### **Documentation**
- `FIX_QR_PAYMENT_NOW.md` - QR payment troubleshooting guide
- `DEVICE_LIMIT_AND_PAYMENT_CHANGES.md` - Feature documentation
- `DIAGNOSE_QR_PAYMENT.md` - Detailed payment debugging

### **API Routes**
- `/api/payments/create-order` - Create payment order
- `/api/payments/verify` - Verify payment after success
- `/api/payments/status` - Poll payment status (for QR)
- `/api/webhooks/razorpay` - Webhook handler
- `/api/auth/login` - Login with device limit check
- `/api/admin/users/[userId]/reset-devices` - Admin device reset

---

## 🎯 Success Criteria

### **Payment Flow Works When:**
- ✅ User can select any plan from /upgrade
- ✅ Payment creates order successfully
- ✅ QR code displays in Razorpay modal
- ✅ After payment, auto-verifies within 10 seconds
- ✅ Dashboard shows correct plan and validity
- ✅ Admin panel shows payment with correct amount
- ✅ Validity matches plan's `validity_days` setting

### **Device Limit Works When:**
- ✅ User can login on 2 devices simultaneously
- ✅ 3rd device shows clear error message
- ✅ Admin can reset devices via admin panel
- ✅ Inactive devices auto-expire after 90 days
- ✅ Same device login updates `last_seen` timestamp

### **System is Production-Ready When:**
- ✅ All migrations run successfully
- ✅ Webhook configured and logging 200 OK
- ✅ No CHECK constraint errors in logs
- ✅ Test payment completes end-to-end
- ✅ All monitoring logs show green checks

---

## 🆘 Troubleshooting

### **Payment Not Updating?**
1. Check Vercel logs for errors
2. Verify webhook is configured
3. Check database for payment record
4. Run `FIX_ONE_TIME_BILLING_PRODUCTION.sql` if constraint errors

### **Device Limit Not Working?**
1. Check if `user_devices` table exists
2. Verify login API route is being called
3. Check browser console for errors
4. Test device fingerprint generation

### **Wrong Validity Period?**
1. Check `plans` table → `validity_days` column
2. Verify plan ID matches (lowercase, e.g., 'plus' not 'PLUS')
3. Check webhook logs for validity calculation
4. Ensure RPC function `update_user_subscription` is working

---

**Last Updated:** 2026-02-13
**Version:** 1.0
**Status:** Ready for Production (after migrations)
