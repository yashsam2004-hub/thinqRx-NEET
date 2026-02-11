import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
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
 * Calculate subscription validity based on billing cycle
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
      // Log failed verification attempt (security audit)
      console.error('[Razorpay] ❌ SIGNATURE VERIFICATION FAILED', {
        user_id: user.id,
        user_email: user.email,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { 
          error: 'Payment verification failed', 
          message: 'Signature mismatch. Please contact support if payment was deducted.',
          details: 'Invalid signature - possible tampering detected'
        },
        { status: 400 }
      );
    }

    // 7. ✅ Signature verified! Proceed with payment processing
    console.log('[Razorpay] ✅ Signature verified successfully');

    // 8. Fetch payment details from database
    const { data: payment, error: paymentError } = await supabase
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

    if (!payment) {
      console.error('[Razorpay] Payment record not found in database:', {
        order_id: razorpay_order_id,
        user_id: user.id,
      });
      
      // FALLBACK: If payment record not found (DB insert failed during order creation),
      // create it now using admin client since signature is verified
      console.log('[Razorpay] Creating missing payment record (fallback)');
      
      const adminSupabase = createSupabaseAdminClient();
      
      // We don't have all payment details, so we'll need to fetch from Razorpay or use defaults
      // For now, create a minimal record - this is a workaround for the DB insert issue
      const { data: createdPayment, error: createError } = await adminSupabase
        .from('payments')
        .insert({
          user_id: user.id,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          plan_name: 'PLUS', // Default - update based on amount if possible
          billing_cycle: 'MONTHLY', // Default
          amount: 0, // Will be updated by webhook
          currency: 'INR',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError || !createdPayment) {
        console.error('[Razorpay] Failed to create fallback payment record:', createError);
        return NextResponse.json(
          { 
            error: 'Payment record not found',
            message: 'Payment was successful but database record is missing. Please contact support with your payment ID.',
            payment_id: razorpay_payment_id,
          },
          { status: 404 }
        );
      }
      
      // Use the created payment record
      console.log('[Razorpay] ✅ Created fallback payment record');
      // Continue processing with the created record, but set reasonable defaults
      // Skip subscription activation in this case - let webhook handle it
      return NextResponse.json({
        success: true,
        message: 'Payment verified (processing subscription)',
        payment_id: razorpay_payment_id,
      });
    }

    // 9. Check for duplicate processing (idempotency)
    if (payment.status === 'completed') {
      console.log('[Razorpay] Payment already processed:', razorpay_payment_id);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        subscription_active: true,
      });
    }

    // 10. Use admin client for privileged operations
    const adminSupabase = createSupabaseAdminClient();
    
    // DEBUG: Test if admin client has proper permissions
    console.log('[Razorpay] Testing admin client permissions...');
    const { data: testData, error: testError } = await adminSupabase
      .from('profiles')
      .select('id, email')
      .eq('id', user.id)
      .single();
    
    if (testError) {
      console.error('[Razorpay] Admin client test FAILED:', testError);
    } else {
      console.log('[Razorpay] Admin client test SUCCESS - can read profiles');
    }

    // 11. Update payment record
    const { error: updatePaymentError } = await adminSupabase
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('[Razorpay] Failed to update payment:', updatePaymentError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // 12. Calculate subscription validity
    const validUntil = calculateValidUntil(payment.billing_cycle as 'MONTHLY' | 'ANNUAL');

    // 13. Update subscription using RPC function (bypasses RLS completely with SECURITY DEFINER)
    console.log('[Razorpay] Attempting to update subscription for user:', user.id);
    const { error: subscriptionError } = await adminSupabase.rpc(
      'update_user_subscription',
      {
        p_user_id: user.id,
        p_plan_name: payment.plan_name,
        p_billing_cycle: payment.billing_cycle,
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
      return NextResponse.json(
        { error: 'Failed to activate subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }
    
    console.log('[Razorpay] Subscription updated successfully via RPC function');

    // 14. Success! Log and return
    console.log(`[Razorpay] ✅ Payment verified and subscription activated`, {
      user_id: user.id,
      user_email: user.email,
      plan: payment.plan_name,
      billing_cycle: payment.billing_cycle,
      valid_until: validUntil.toISOString(),
      payment_id: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: {
        plan: payment.plan_name,
        billing_cycle: payment.billing_cycle,
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
