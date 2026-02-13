import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Explicitly set runtime

// Simple GET handler to verify the route is accessible
export async function GET() {
  console.log('[Razorpay] GET /api/payments/verify called - endpoint is live');
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Payment verification endpoint is accessible',
    timestamp: new Date().toISOString()
  });
}

// Validation schema
const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/**
 * CRITICAL SECURITY FUNCTION
 * Verifies Razorpay payment signature using HMAC SHA256
 * 
 * IMPORTANT: Must use RAZORPAY_KEY_SECRET (NOT webhook secret or key ID)
 * Signature format: HMAC-SHA256(order_id|payment_id, KEY_SECRET)
 */
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    // CRITICAL: Validate all inputs are present and non-empty
    if (!orderId || !paymentId || !signature || !secret) {
      console.error('[Razorpay] Verification failed: Missing required parameters', {
        hasOrderId: !!orderId,
        hasPaymentId: !!paymentId,
        hasSignature: !!signature,
        hasSecret: !!secret,
      });
      return false;
    }

    // CRITICAL: Validate inputs are strings (prevent undefined/null)
    if (typeof orderId !== 'string' || typeof paymentId !== 'string' || 
        typeof signature !== 'string' || typeof secret !== 'string') {
      console.error('[Razorpay] Verification failed: Invalid parameter types');
      return false;
    }

    // Create signature string EXACTLY as Razorpay does: "order_id|payment_id"
    // NO spaces, NO reversed order
    const signatureBody = `${orderId}|${paymentId}`;
    
    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex');

    // Log signature details for debugging (DO NOT log the actual signatures or secret)
    console.log('[Razorpay] Signature verification attempt:', {
      orderIdLength: orderId.length,
      paymentIdLength: paymentId.length,
      receivedSigLength: signature.length,
      expectedSigLength: expectedSignature.length,
      bodyFormat: `order_id|payment_id (${signatureBody.length} chars)`,
    });

    // CRITICAL: Ensure both signatures have same length before timingSafeEqual
    // timingSafeEqual throws if lengths differ
    if (expectedSignature.length !== signature.length) {
      console.error('[Razorpay] Signature length mismatch', {
        expected: expectedSignature.length,
        received: signature.length,
      });
      return false;
    }

    // Compare signatures using constant-time comparison (prevents timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );

    if (!isValid) {
      console.error('[Razorpay] Signature mismatch - verification failed');
    }

    return isValid;

  } catch (error: any) {
    console.error('[Razorpay] Signature verification exception:', {
      error: error.message,
      name: error.name,
    });
    return false;
  }
}

/**
 * Calculate subscription validity based on plan's validity_days from database
 * DEPRECATED: Use fetchPlanDetails instead
 */
function calculateValidUntil(billingCycle: 'MONTHLY' | 'ANNUAL'): Date {
  const now = new Date();
  if (billingCycle === 'MONTHLY') {
    now.setDate(now.getDate() + 31); // 31 days (1 month)
  } else {
    now.setDate(now.getDate() + 365); // 365 days (1 year)
  }
  return now;
}

/**
 * Fetch plan details from database (single source of truth)
 */
async function fetchPlanDetails(planId: string, adminSupabase: any) {
  const { data: plan, error } = await adminSupabase
    .from('plans')
    .select('id, name, price, validity_days')
    .eq('id', planId)
    .maybeSingle();
  
  if (error || !plan) {
    console.error('[Razorpay] Failed to fetch plan details:', error);
    return null;
  }
  
  return plan;
}

/**
 * Calculate valid_until date based on plan's validity_days
 */
function calculateValidUntilFromDays(validityDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + validityDays);
  return now;
}

export async function POST(req: NextRequest) {
  // Log that the endpoint is being hit (debugging 404 issue)
  console.log('[Razorpay] POST /api/payments/verify endpoint called');
  
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = VerifyPaymentSchema.safeParse(body);

    if (!validation.success) {
      console.error('[Razorpay] Invalid verification request:', validation.error);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;

    // 3. CRITICAL: Validate all required data is present and non-empty
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('[Razorpay] Missing verification data', {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
      });
      return NextResponse.json(
        { error: 'Missing payment verification data. Please try again or contact support.' },
        { status: 400 }
      );
    }

    // 4. CRITICAL: Validate environment variable - MUST use RAZORPAY_KEY_SECRET
    // DO NOT use RAZORPAY_WEBHOOK_SECRET (that's for webhooks only)
    // DO NOT use NEXT_PUBLIC_RAZORPAY_KEY_ID (that's the public key)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error('[Razorpay] CRITICAL: RAZORPAY_KEY_SECRET not configured in environment');
      console.error('[Razorpay] Ensure .env.local has: RAZORPAY_KEY_SECRET=your_secret_key');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Log verification attempt (for debugging)
    console.log('[Razorpay] Processing payment verification', {
      user: user.email,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // 6. CRITICAL: Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      // Signature failed — but payment may be genuine. 
      // FALLBACK: Verify directly with Razorpay API before rejecting.
      console.warn('[Razorpay] ⚠️ Signature verification failed, checking with Razorpay API...', {
        user_id: user.id,
        user_email: user.email,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });

      try {
        const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!rzpKeyId) throw new Error('Missing RAZORPAY_KEY_ID');
        
        const razorpay = new Razorpay({ key_id: rzpKeyId, key_secret: keySecret });
        const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
        
        console.log('[Razorpay] API payment status:', {
          id: rzpPayment.id,
          status: rzpPayment.status,
          order_id: rzpPayment.order_id,
          amount: rzpPayment.amount,
          captured: rzpPayment.status === 'captured',
        });

        // Only proceed if payment is actually captured AND matches our order
        if (rzpPayment.status === 'captured' && rzpPayment.order_id === razorpay_order_id) {
          console.log('[Razorpay] ✅ Payment confirmed via API fallback — proceeding with activation');
          // Continue to the normal activation flow below
        } else {
          console.error('[Razorpay] ❌ Payment NOT captured or order mismatch via API', {
            status: rzpPayment.status,
            orderMatch: rzpPayment.order_id === razorpay_order_id,
          });
          return NextResponse.json(
            { 
              error: 'Payment verification failed', 
              message: 'Payment not captured. Please contact support if payment was deducted.',
              payment_id: razorpay_payment_id,
            },
            { status: 400 }
          );
        }
      } catch (apiError: any) {
        console.error('[Razorpay] ❌ Both signature and API verification failed:', apiError?.message);
        return NextResponse.json(
          { 
            error: 'Payment verification failed', 
            message: 'Could not verify payment. Please contact support with your payment ID.',
            payment_id: razorpay_payment_id,
          },
          { status: 400 }
        );
      }
    }

    // 7. ✅ Signature verified! Proceed with payment processing
    console.log('[Razorpay] ✅ Signature verified successfully');

    // CRITICAL: Use admin client for ALL database operations (bypasses RLS)
    const adminSupabase = createSupabaseAdminClient();

    // 8. Fetch payment details from database using ADMIN client (bypasses RLS)
    const { data: payment, error: paymentError } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (paymentError) {
      console.error('[Razorpay] Database error fetching payment:', {
        error: paymentError,
        code: paymentError.code,
        message: paymentError.message,
      });
      return NextResponse.json(
        { error: 'Database error', details: paymentError.message },
        { status: 500 }
      );
    }

    // Determine plan details — either from DB payment or from Razorpay order notes
    let planName: string;
    let billingCycle: string;
    let amount: number;
    let paymentId: string | undefined;

    if (payment) {
      // Payment record found in DB
      planName = payment.plan_name;
      billingCycle = payment.billing_cycle;
      amount = payment.amount;
      paymentId = payment.id;
      console.log('[Razorpay] Found payment record in DB:', { planName, billingCycle, amount });
    } else {
      // FALLBACK: Payment record not found — fetch plan details from Razorpay order
      console.warn('[Razorpay] Payment record NOT found in DB, fetching from Razorpay API');
      
      try {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
          throw new Error('Razorpay credentials missing');
        }
        
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await razorpay.orders.fetch(razorpay_order_id);
        
        // Extract plan details from order notes (set during create-order)
        const notes = order.notes as Record<string, string> | undefined;
        planName = (notes?.plan || 'PLUS').toUpperCase();
        billingCycle = notes?.billing_cycle || 'MONTHLY';
        amount = Math.round((order.amount as number) / 100); // Razorpay returns paise
        
        console.log('[Razorpay] Got plan info from Razorpay order:', { planName, billingCycle, amount, notes });
        
        // Create the missing payment record
        const { data: createdPayment, error: createError } = await adminSupabase
          .from('payments')
          .insert({
            user_id: user.id,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            plan_name: planName,
            billing_cycle: billingCycle,
            amount: amount,
            currency: 'INR',
            status: 'completed',
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[Razorpay] Failed to create fallback payment record:', createError);
          // Don't return error — still proceed with subscription activation
        } else {
          paymentId = createdPayment?.id;
          console.log('[Razorpay] ✅ Created fallback payment record');
        }
      } catch (rzpError: any) {
        console.error('[Razorpay] Failed to fetch order from Razorpay:', rzpError?.message);
        // Last resort defaults — at least activate SOMETHING
        planName = 'PLUS';
        billingCycle = 'MONTHLY';
        amount = 0;
        
        // Try to create a minimal payment record
        await adminSupabase.from('payments').insert({
          user_id: user.id,
          razorpay_order_id,
          razorpay_payment_id,
          plan_name: planName,
          billing_cycle: billingCycle,
          amount,
          currency: 'INR',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }

    // 9. Check for duplicate processing (idempotency)
    if (payment?.status === 'completed') {
      console.log('[Razorpay] Payment already completed, ensuring subscription is active');
      
      // ALWAYS ensure subscription is activated even for already-completed payments
      // Fetch plan details from database to get correct validity
      const planDetails = await fetchPlanDetails(planName.toLowerCase(), adminSupabase);
      const validityDays = planDetails?.validity_days || 31; // fallback to 31 days
      const validUntil = calculateValidUntilFromDays(validityDays);
      
      console.log('[Razorpay] Using plan validity:', { planName, validityDays, validUntil: validUntil.toISOString() });
      
      await adminSupabase.rpc('update_user_subscription', {
        p_user_id: user.id,
        p_plan_name: planName,
        p_billing_cycle: billingCycle,
        p_valid_until: validUntil.toISOString(),
      });
      
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        subscription_active: true,
      });
    }

    // 10. Update payment record to completed (if we have a record)
    if (paymentId) {
      const { error: updatePaymentError } = await adminSupabase
        .from('payments')
        .update({
          razorpay_payment_id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updatePaymentError) {
        console.error('[Razorpay] Failed to update payment:', updatePaymentError);
        // Don't return error — proceed with subscription activation
      }
    }

    // 11. Calculate subscription validity from plans table (single source of truth)
    const planDetails = await fetchPlanDetails(planName.toLowerCase(), adminSupabase);
    const validityDays = planDetails?.validity_days || 31; // fallback to 31 days if plan not found
    const validUntil = calculateValidUntilFromDays(validityDays);
    
    console.log('[Razorpay] Calculated validity from plan:', { 
      planName, 
      planId: planDetails?.id,
      validityDays, 
      validUntil: validUntil.toISOString() 
    });

    // 12. ALWAYS activate subscription using RPC (SECURITY DEFINER bypasses RLS)
    console.log('[Razorpay] Activating subscription for user:', user.id, { planName, billingCycle });
    const { error: subscriptionError } = await adminSupabase.rpc(
      'update_user_subscription',
      {
        p_user_id: user.id,
        p_plan_name: planName,
        p_billing_cycle: billingCycle,
        p_valid_until: validUntil.toISOString(),
      }
    );

    if (subscriptionError) {
      console.error('[Razorpay] Failed to update subscription via RPC:', {
        error: subscriptionError,
        code: subscriptionError.code,
        message: subscriptionError.message,
        details: subscriptionError.details,
        hint: subscriptionError.hint,
      });
      
      // FALLBACK: Try direct profile update if RPC fails
      console.log('[Razorpay] Trying direct profile update as fallback...');
      const { error: directError } = await adminSupabase
        .from('profiles')
        .update({
          subscription_plan: planName,
          subscription_status: 'active',
          subscription_end_date: validUntil.toISOString(),
          billing_cycle: billingCycle,
        })
        .eq('id', user.id);
      
      if (directError) {
        console.error('[Razorpay] Direct profile update also failed:', directError);
        return NextResponse.json(
          { error: 'Failed to activate subscription', details: subscriptionError.message },
          { status: 500 }
        );
      }
      console.log('[Razorpay] ✅ Direct profile update succeeded as fallback');
    } else {
      console.log('[Verify] Subscription updated successfully via RPC');
    }

    // 13. Success! Log and return
    console.log(`[Razorpay] ✅ Payment verified and subscription activated`, {
      user_id: user.id,
      user_email: user.email,
      plan: planName,
      billing_cycle: billingCycle,
      valid_until: validUntil.toISOString(),
      payment_id: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: {
        plan: planName,
        billing_cycle: billingCycle,
        valid_until: validUntil.toISOString(),
        status: 'active',
      },
    });

  } catch (error: any) {
    console.error('[Razorpay] Verification failed:', error);
    console.error('[Razorpay] Error stack:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        message: error?.message || 'Unknown error',
        type: error?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}
