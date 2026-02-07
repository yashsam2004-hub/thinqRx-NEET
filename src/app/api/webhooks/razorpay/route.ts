import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * CRITICAL: Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[Razorpay Webhook] Signature verification error:', error);
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

/**
 * Razorpay Webhook Handler
 * 
 * Handles critical payment events:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - order.paid: Order completed (backup)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body (needed for signature verification)
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Razorpay Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 2. Validate environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // 3. CRITICAL: Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('[Razorpay Webhook] INVALID SIGNATURE', {
        timestamp: new Date().toISOString(),
        signature: signature.substring(0, 20) + '...',
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 4. Parse webhook payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    // 5. Use admin client for privileged operations
    const adminSupabase = createSupabaseAdminClient();

    // 6. Handle different webhook events
    switch (event) {
      case 'payment.captured': {
        // Payment was successfully captured
        const paymentId = paymentEntity?.id;
        const orderId = paymentEntity?.order_id;
        const amount = paymentEntity?.amount; // in paise
        const status = paymentEntity?.status;

        console.log(`[Razorpay Webhook] Payment captured: ${paymentId}`);

        if (!orderId || !paymentId) {
          console.error('[Razorpay Webhook] Missing payment/order ID');
          return NextResponse.json({ received: true });
        }

        // Find payment record
        const { data: payment, error: paymentError } = await adminSupabase
          .from('payments')
          .select('*')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        if (paymentError || !payment) {
          console.error('[Razorpay Webhook] Payment record not found:', orderId);
          return NextResponse.json({ received: true });
        }

        // Check for duplicate processing
        if (payment.status === 'completed') {
          console.log('[Razorpay Webhook] Payment already processed:', paymentId);
          return NextResponse.json({ received: true });
        }

        // Update payment record
        const { error: updatePaymentError } = await adminSupabase
          .from('payments')
          .update({
            razorpay_payment_id: paymentId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: paymentEntity,
          })
          .eq('id', payment.id);

        if (updatePaymentError) {
          console.error('[Razorpay Webhook] Failed to update payment:', updatePaymentError);
          return NextResponse.json({ received: true }, { status: 500 });
        }

        // Calculate subscription validity
        const validUntil = calculateValidUntil(payment.billing_cycle as 'MONTHLY' | 'ANNUAL');

        // Update subscription
        const { error: subscriptionError } = await adminSupabase
          .from('profiles')
          .update({
            subscription_plan: payment.plan_name,
            subscription_status: 'active',
            subscription_end_date: validUntil.toISOString(),
            billing_cycle: payment.billing_cycle,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.user_id);

        if (subscriptionError) {
          console.error('[Razorpay Webhook] Failed to update subscription:', subscriptionError);
          return NextResponse.json({ received: true }, { status: 500 });
        }

        console.log(`[Razorpay Webhook] ✅ Subscription activated via webhook`, {
          user_id: payment.user_id,
          plan: payment.plan_name,
          billing_cycle: payment.billing_cycle,
          valid_until: validUntil.toISOString(),
        });

        break;
      }

      case 'payment.failed': {
        // Payment failed
        const paymentId = paymentEntity?.id;
        const orderId = paymentEntity?.order_id;
        const errorCode = paymentEntity?.error_code;
        const errorDescription = paymentEntity?.error_description;

        console.error(`[Razorpay Webhook] Payment failed: ${paymentId}`, {
          error_code: errorCode,
          error_description: errorDescription,
        });

        if (!orderId) {
          return NextResponse.json({ received: true });
        }

        // Update payment record
        const { error: updateError } = await adminSupabase
          .from('payments')
          .update({
            razorpay_payment_id: paymentId,
            status: 'failed',
            notes: {
              error_code: errorCode,
              error_description: errorDescription,
              ...paymentEntity,
            },
          })
          .eq('razorpay_order_id', orderId);

        if (updateError) {
          console.error('[Razorpay Webhook] Failed to update failed payment:', updateError);
        }

        break;
      }

      case 'order.paid': {
        // Backup event - order was paid
        const orderId = orderEntity?.id;
        console.log(`[Razorpay Webhook] Order paid: ${orderId}`);

        // This is handled by payment.captured, but good to log
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    // 7. Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Razorpay Webhook] Error processing webhook:', error);
    
    // Still return 200 to avoid Razorpay retries
    return NextResponse.json({ received: true });
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
