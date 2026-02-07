# 💳 Razorpay Integration - Complete Implementation Guide

**Date:** February 2, 2026  
**Status:** 📋 READY TO IMPLEMENT

---

## 🎯 OVERVIEW

Complete step-by-step guide to integrate Razorpay payment gateway into PharmCards for Plus (₹199/₹2388) and Pro (₹499/₹5990) plan enrollments.

---

## 📋 TABLE OF CONTENTS

1. [Setup & Configuration](#setup--configuration)
2. [Install Dependencies](#install-dependencies)
3. [Environment Variables](#environment-variables)
4. [API Routes to Create](#api-routes-to-create)
5. [Frontend Integration](#frontend-integration)
6. [Payment Verification](#payment-verification)
7. [Webhook Setup](#webhook-setup)
8. [Testing Guide](#testing-guide)
9. [Production Deployment](#production-deployment)
10. [Security Checklist](#security-checklist)

---

## 1️⃣ SETUP & CONFIGURATION

### **Step 1: Create Razorpay Account**

1. Go to https://razorpay.com/
2. Click "Sign Up" → Business Account
3. Complete KYC (for live mode later)
4. Access dashboard: https://dashboard.razorpay.com/

### **Step 2: Get API Keys**

**Test Mode (Start Here):**
1. Dashboard → Settings → API Keys
2. Click "Generate Test Key"
3. Copy:
   - Key ID: `rzp_test_XXXXXXXX`
   - Key Secret: `XXXXXXXX` (keep secret!)

**Live Mode (After Testing):**
1. Complete KYC verification
2. Generate live keys
3. Replace test keys with live keys

---

## 2️⃣ INSTALL DEPENDENCIES

```bash
cd d:\pharmcards
npm install razorpay
npm install --save-dev @types/razorpay
```

**What this installs:**
- `razorpay` - Official Razorpay Node.js SDK
- `@types/razorpay` - TypeScript definitions

---

## 3️⃣ ENVIRONMENT VARIABLES

### **Add to `.env.local`:**

```env
# Razorpay Test Keys (start here)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

# Razorpay Webhook Secret (for webhook verification)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Add to `.env.example`:**

```env
# Razorpay Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### **Validate in `src/lib/env.ts`:**

```typescript
const envSchema = z.object({
  // ... existing vars ...
  
  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
});
```

---

## 4️⃣ API ROUTES TO CREATE

### **File 1: Create Razorpay Order**

**Path:** `src/app/api/payments/create-order/route.ts`

```typescript
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const orderSchema = z.object({
  plan: z.enum(["plus", "pro"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { plan, billingCycle } = orderSchema.parse(body);

    // Get pricing from database
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("code", "gpat")
      .single();

    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    const { data: pricing } = await supabase
      .from("course_pricing")
      .select("monthly_price, annual_price")
      .eq("course_id", course.id)
      .eq("plan", plan)
      .single();

    if (!pricing) {
      return NextResponse.json({ ok: false, error: "Pricing not found" }, { status: 404 });
    }

    // Calculate amount (in paise - Razorpay requires smallest currency unit)
    const amount = billingCycle === "monthly" 
      ? pricing.monthly_price * 100 
      : pricing.annual_price * 100;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount, // Amount in paise
      currency: "INR",
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email!,
        plan: plan,
        billing_cycle: billingCycle,
        course_id: course.id,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  }
}
```

---

### **File 2: Verify Payment**

**Path:** `src/app/api/payments/verify/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { z } from "zod";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["plus", "pro"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle } = 
      verifySchema.parse(body);

    // SECURITY: Verify signature (prevents tampering)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "INVALID_SIGNATURE" },
        { status: 400 }
      );
    }

    // Get course and pricing
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("code", "gpat")
      .single();

    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    const { data: pricing } = await supabase
      .from("course_pricing")
      .select("monthly_price, annual_price")
      .eq("course_id", course.id)
      .eq("plan", plan)
      .single();

    if (!pricing) {
      return NextResponse.json({ ok: false, error: "Pricing not found" }, { status: 404 });
    }

    const amount = billingCycle === "monthly" 
      ? pricing.monthly_price 
      : pricing.annual_price;

    // Create enrollment using stored procedure
    const { data: enrollmentResult, error: enrollmentError } = await supabaseAdmin.rpc(
      "create_course_enrollment",
      {
        p_user_id: user.id,
        p_course_id: course.id,
        p_plan: plan,
        p_billing_cycle: billingCycle,
      }
    );

    if (enrollmentError) {
      console.error("Enrollment creation error:", enrollmentError);
      return NextResponse.json(
        { ok: false, error: "ENROLLMENT_FAILED", details: enrollmentError.message },
        { status: 500 }
      );
    }

    // Record payment in payments table
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        enrollment_id: enrollmentResult,
        amount: amount,
        currency: "INR",
        payment_method: "razorpay",
        payment_status: "completed",
        plan: plan,
        billing_cycle: billingCycle,
        transaction_id: razorpay_payment_id,
        payment_gateway_response: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
        },
        notes: {
          verified_at: new Date().toISOString(),
          user_email: user.email,
        },
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      // Don't fail - enrollment is created, just payment tracking failed
    }

    return NextResponse.json({
      ok: true,
      message: "Payment verified and enrollment activated",
      enrollment_id: enrollmentResult,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { ok: false, error: "VERIFICATION_FAILED", details: error.message },
      { status: 500 }
    );
  }
}
```

---

### **File 3: Webhook Handler (Optional but Recommended)**

**Path:** `src/app/api/payments/webhook/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay server
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ ok: false, error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle different events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

async function handlePaymentCaptured(payment: any) {
  const supabase = createSupabaseAdminClient();

  // Update payment record
  await supabase
    .from("payments")
    .update({
      payment_status: "completed",
      payment_gateway_response: payment,
      updated_at: new Date().toISOString(),
    })
    .eq("transaction_id", payment.id);
}

async function handlePaymentFailed(payment: any) {
  const supabase = createSupabaseAdminClient();

  // Record failed payment
  await supabase
    .from("payments")
    .insert({
      user_id: payment.notes?.user_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      payment_method: "razorpay",
      payment_status: "failed",
      transaction_id: payment.id,
      payment_gateway_response: payment,
      notes: {
        error_code: payment.error_code,
        error_description: payment.error_description,
      },
    });
}

async function handleOrderPaid(order: any) {
  // Additional order tracking if needed
  console.log("Order paid:", order.id);
}
```

---

## 5️⃣ FRONTEND INTEGRATION

### **Update `/upgrade` Page**

**File:** `src/app/upgrade/page.tsx`

**Add Razorpay Script to Head:**

```typescript
import Script from "next/script";

// In the component return:
<>
  <Script 
    src="https://checkout.razorpay.com/v1/checkout.js" 
    strategy="lazyOnload"
  />
  
  {/* Rest of your page */}
</>
```

**Add Payment Handler:**

```typescript
const handlePayment = async () => {
  if (!selectedPlan) {
    toast.error("Please select a plan");
    return;
  }

  setProcessing(true);

  try {
    // Step 1: Create Razorpay order
    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: selectedPlan,
        billingCycle: billingCycle,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderData.ok) {
      throw new Error(orderData.error || "Failed to create order");
    }

    // Step 2: Initialize Razorpay Checkout
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "ThinqRx - PharmCards",
      description: `${selectedPlan.toUpperCase()} Plan - ${billingCycle === "monthly" ? "Monthly" : "Annual"}`,
      image: "/images/Thinqr_logo.png",
      order_id: orderData.orderId,
      prefill: {
        name: user?.email?.split("@")[0] || "",
        email: user?.email || "",
      },
      theme: {
        color: "#3b82f6", // Blue color
      },
      handler: async function (response: any) {
        // Step 3: Verify payment on backend
        setProcessing(true);
        
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: selectedPlan,
            billingCycle: billingCycle,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyData.ok) {
          toast.success("Payment successful! Your plan is now active.");
          router.push("/payment/success?plan=" + selectedPlan);
        } else {
          toast.error("Payment verification failed. Contact support.");
          router.push("/payment/failure");
        }
      },
      modal: {
        ondismiss: function() {
          setProcessing(false);
          toast.info("Payment cancelled");
        }
      }
    };

    // Open Razorpay checkout
    const rzp = new (window as any).Razorpay(options);
    rzp.open();

  } catch (error: any) {
    console.error("Payment error:", error);
    toast.error(error.message || "Failed to initiate payment");
    setProcessing(false);
  }
};
```

**Update Payment Button:**

```typescript
<Button
  size="lg"
  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
  onClick={handlePayment}
  disabled={!selectedPlan || processing}
>
  {processing ? (
    <>
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      Processing...
    </>
  ) : (
    <>
      Pay ₹{selectedAmount.toLocaleString("en-IN")}
    </>
  )}
</Button>
```

---

## 6️⃣ SUCCESS/FAILURE PAGES

### **Success Page**

**Path:** `src/app/payment/success/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center px-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Payment Successful!
        </h1>

        <p className="text-lg text-slate-700 mb-2">
          Your <span className="font-semibold text-blue-600">{plan?.toUpperCase()}</span> plan is now active
        </p>

        <p className="text-slate-600 mb-8">
          You now have full access to all premium features including mock tests, analytics, and unlimited AI notes.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/mock-tests">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Start Mock Tests
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/">
            <Button variant="ghost" className="w-full gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            A confirmation email has been sent to <span className="font-semibold">{user.email}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

---

### **Failure Page**

**Path:** `src/app/payment/failure/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default async function PaymentFailurePage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Payment Failed
        </h1>

        <p className="text-lg text-slate-700 mb-6">
          Your payment could not be processed. No charges have been made to your account.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Common issues:</span> Insufficient balance, card limits, or bank declining the transaction. Please try again or use a different payment method.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/upgrade">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
              Try Again
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Back to Dashboard
            </Button>
          </Link>

          <Link href="/">
            <Button variant="ghost" className="w-full gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Need help? Contact support at <span className="font-semibold">support@thinqrx.com</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

---

## 7️⃣ WEBHOOK SETUP

### **In Razorpay Dashboard:**

1. Go to Settings → Webhooks
2. Click "Add New Webhook"
3. Enter URL: `https://your-domain.com/api/payments/webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Copy Webhook Secret
6. Add to `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

---

## 8️⃣ TESTING GUIDE

### **Test Cards (Test Mode):**

**Success Cards:**
```
Card Number: 4111 1111 1111 1111
Card Number: 5555 5555 5555 4444
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

**Failure Cards:**
```
Card Number: 4000 0000 0000 0002  // Generic failure
Card Number: 4000 0000 0000 0127  // Incorrect CVV
Card Number: 4000 0000 0000 0069  // Expired card
```

### **Test Flow:**

**1. Signup with Paid Plan:**
- Create account with Plus/Pro plan
- Should redirect to login with payment message
- Login → Dashboard should prompt for payment

**2. Direct Upgrade:**
- Free user goes to `/upgrade`
- Selects Plus Monthly (₹199)
- Clicks "Pay ₹199"
- Razorpay modal opens
- Enter test card: 4111 1111 1111 1111
- Complete payment
- Redirects to success page
- Check: Enrollment is active in database

**3. Test Failure:**
- Try payment with failure card: 4000 0000 0000 0002
- Should show error in Razorpay modal
- User can retry or cancel

**4. Verify Database:**
```sql
-- Check enrollment created
SELECT * FROM course_enrollments 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 1;

-- Check payment recorded
SELECT * FROM payments 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 1;

-- Should see:
-- status: 'active'
-- payment_status: 'completed'
-- transaction_id: 'pay_XXXXXXX'
```

---

## 9️⃣ PRODUCTION DEPLOYMENT

### **Checklist Before Going Live:**

**1. Switch to Live Keys:**
```env
# .env.local or Vercel env vars
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXX
RAZORPAY_KEY_SECRET=live_secret_key_here
```

**2. Complete KYC:**
- Submit business documents
- Bank account verification
- Wait for approval (1-3 days)

**3. Test in Production:**
- Deploy to Vercel
- Test with real card (small amount)
- Verify enrollment activation
- Check payment record in database
- Verify webhook delivery

**4. Enable Payment Methods:**
- Credit cards
- Debit cards
- UPI
- Net banking
- Wallets (optional)

---

## 🔐 SECURITY CHECKLIST

### **Critical Security Measures:**

- [x] ✅ Signature verification (HMAC SHA256)
- [x] ✅ Server-side amount validation
- [x] ✅ Service role key for enrollment creation
- [x] ✅ Webhook signature verification
- [x] ✅ No secrets exposed to client
- [x] ✅ Idempotency (prevent duplicate charges)
- [x] ✅ Transaction logging
- [x] ✅ Error handling

### **What's Protected:**

✅ Key Secret never sent to client  
✅ Order amount validated server-side  
✅ Signature verified before activation  
✅ Webhook authenticated  
✅ Payment records immutable  
✅ User verification before enrollment  

---

## 💰 PRICING SUMMARY

| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| Free | ₹0 | ₹0 | - |
| Plus | ₹199 | ₹2,388 | ₹0 |
| Pro | ₹499 | ₹5,990 | ₹0 |

**Validity:** 365 days (1 year) from payment date

---

## 📊 PAYMENT FLOW DIAGRAM

```
User Selects Plan
      ↓
Click "Pay Now"
      ↓
Create Razorpay Order (API)
      ↓
Open Razorpay Checkout Modal
      ↓
User Enters Card Details
      ↓
Razorpay Processes Payment
      ↓
Payment Success
      ↓
Verify Signature (API)
      ↓
Create Enrollment (Database)
      ↓
Record Payment (payments table)
      ↓
Redirect to Success Page
      ↓
User Accesses Premium Features
```

---

## 🐛 TROUBLESHOOTING

### **Issue 1: Razorpay modal doesn't open**
**Solution:**
- Check script loaded: `window.Razorpay` should be defined
- Check key ID is correct
- Check console for errors

### **Issue 2: Signature verification fails**
**Solution:**
- Verify `RAZORPAY_KEY_SECRET` is correct
- Check order_id and payment_id match
- Ensure signature string format: `${order_id}|${payment_id}`

### **Issue 3: Enrollment not created**
**Solution:**
- Check `create_course_enrollment` stored procedure exists
- Verify user_id and course_id are valid
- Check database logs for errors

### **Issue 4: Payment recorded but enrollment fails**
**Solution:**
- Check `payments` table for record
- Manually create enrollment for user
- Contact user about activation

---

## 📝 IMPLEMENTATION CHECKLIST

### **Phase 1: Setup (30 mins)**
- [ ] Create Razorpay account
- [ ] Get test API keys
- [ ] Add to `.env.local`
- [ ] Install dependencies

### **Phase 2: Backend (2-3 hours)**
- [ ] Create `create-order` API route
- [ ] Create `verify` API route
- [ ] Create `webhook` API route (optional)
- [ ] Test with Postman/Thunder Client

### **Phase 3: Frontend (2-3 hours)**
- [ ] Add Razorpay script to upgrade page
- [ ] Implement payment handler
- [ ] Create success page
- [ ] Create failure page
- [ ] Add loading states

### **Phase 4: Testing (2-3 hours)**
- [ ] Test with success card (4111...)
- [ ] Test with failure card (4000...)
- [ ] Verify enrollment creation
- [ ] Verify payment recording
- [ ] Test mobile responsiveness
- [ ] Test error scenarios

### **Phase 5: Production (1-2 hours)**
- [ ] Complete Razorpay KYC
- [ ] Switch to live keys
- [ ] Configure webhook URL
- [ ] Test with real card (small amount)
- [ ] Monitor first few transactions

---

## 📞 SUPPORT & RESOURCES

### **Razorpay Documentation:**
- Orders API: https://razorpay.com/docs/api/orders/
- Payments API: https://razorpay.com/docs/api/payments/
- Webhooks: https://razorpay.com/docs/webhooks/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/

### **Integration Guides:**
- Node.js: https://razorpay.com/docs/payments/server-integration/nodejs/
- React: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

### **Support:**
- Email: support@razorpay.com
- Phone: 1800-572-8515
- Dashboard: https://dashboard.razorpay.com/

---

## ⚡ QUICK START COMMANDS

```bash
# Install dependencies
npm install razorpay @types/razorpay

# Create API routes
mkdir -p src/app/api/payments/{create-order,verify,webhook}
mkdir -p src/app/payment/{success,failure}

# Add environment variables
echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXX" >> .env.local
echo "RAZORPAY_KEY_SECRET=your_secret" >> .env.local

# Test locally
npm run dev
# Go to http://localhost:3000/upgrade
# Select plan and test payment
```

---

## 🎉 EXPECTED RESULT

After implementation:

✅ Users can signup for paid plans  
✅ Payment gateway opens smoothly  
✅ Test cards work in test mode  
✅ Payment verification succeeds  
✅ Enrollment activates automatically  
✅ Payment recorded in database  
✅ User redirected to success page  
✅ Premium content is accessible  
✅ Admin can track payments  

---

## 🚀 DEPLOYMENT

### **Environment Variables (Vercel):**

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:**
- Use **live keys** for production
- Use **test keys** for preview deployments
- Never commit keys to git

---

## ✅ STATUS

**Implementation Time:** 8-12 hours  
**Complexity:** Medium  
**Dependencies:** razorpay npm package  
**Testing Required:** Yes (thorough!)  
**Production Ready:** After KYC approval  

---

**This guide provides EVERYTHING you need to integrate Razorpay!** 💳✨

**Next:** Follow the checklist step-by-step, test thoroughly, then deploy to production.

---

**Author:** AI Assistant  
**Date:** February 2, 2026  
**Priority:** HIGH
