import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Validation schema
const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/**
 * CRITICAL SECURITY FUNCTION
 * Verifies Razorpay payment signature using HMAC SHA256
 */
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Create expected signature
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[Razorpay] Signature verification error:', error);
    return false;
  }
}

/**
 * Calculate subscription validity based on billing cycle
 */
function calculateValidUntil(billingCycle: 'MONTHLY' | 'ANNUAL'): Date {
  const now = new Date();
  if (billingCycle === 'MONTHLY') {
    now.setDate(now.getDate() + 30); // 30 days
  } else {
    now.setDate(now.getDate() + 365); // 365 days (1 year)
  }
  return now;
}

export async function POST(req: NextRequest) {
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
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;

    // 3. Validate environment variables
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error('[Razorpay] Key secret not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. CRITICAL: Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      // Log failed verification attempt (security audit)
      console.error('[Razorpay] SIGNATURE VERIFICATION FAILED', {
        user_id: user.id,
        user_email: user.email,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // 5. Signature verified ✅ - Fetch payment details from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('[Razorpay] Payment record not found:', paymentError);
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // 6. Check for duplicate processing (idempotency)
    if (payment.status === 'completed') {
      console.log('[Razorpay] Payment already processed:', razorpay_payment_id);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        subscription_active: true,
      });
    }

    // 7. Use admin client for privileged operations
    const adminSupabase = createSupabaseAdminClient();

    // 8. Update payment record
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

    // 9. Calculate subscription validity
    const validUntil = calculateValidUntil(payment.billing_cycle as 'MONTHLY' | 'ANNUAL');

    // 10. Upsert subscription (idempotent)
    const { error: subscriptionError } = await adminSupabase
      .from('profiles')
      .update({
        subscription_plan: payment.plan_name,
        subscription_status: 'active',
        subscription_end_date: validUntil.toISOString(),
        billing_cycle: payment.billing_cycle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (subscriptionError) {
      console.error('[Razorpay] Failed to update subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    // 11. Success! Log and return
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
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
