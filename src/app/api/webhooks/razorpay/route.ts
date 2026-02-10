import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";

/**
 * CRITICAL: Verify Razorpay webhook signature
 * 
 * IMPORTANT: 
 * - Uses RAW request body (NOT JSON parsed)
 * - Uses RAZORPAY_WEBHOOK_SECRET (NOT RAZORPAY_KEY_SECRET)
 * - Compares hex strings with proper encoding
 */
function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  try {
    // CRITICAL FIX: Compute expected signature from raw body
    // Must use the exact raw body string that Razorpay sent
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // CRITICAL FIX: Both signatures are hex strings - must specify 'hex' encoding
    // Without 'hex', Buffer.from() treats them as UTF-8, corrupting the data
    // This was the root cause of signature mismatch
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error: any) {
    console.error('[Razorpay Webhook] Signature verification exception:', {
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
    // 1. CRITICAL: Get RAW request body (do NOT use req.json())
    // Webhook signature is computed on the exact raw bytes Razorpay sent
    const rawBody = await req.text();
    
    // 2. Get signature from header
    const receivedSignature = req.headers.get('x-razorpay-signature');

    if (!receivedSignature) {
      console.error('[Razorpay Webhook] Missing x-razorpay-signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // 3. CRITICAL: Get webhook secret (NOT the key secret!)
    // This is the secret shown in Razorpay Dashboard → Settings → Webhooks
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] CRITICAL: RAZORPAY_WEBHOOK_SECRET not configured');
      console.error('[Razorpay Webhook] Set this in Vercel environment variables');
      console.error('[Razorpay Webhook] Get it from: Razorpay Dashboard → Settings → Webhooks');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // 4. CRITICAL: Verify webhook signature BEFORE processing
    // This ensures the webhook came from Razorpay and wasn't tampered with
    const isValid = verifyWebhookSignature(rawBody, receivedSignature, webhookSecret);

    if (!isValid) {
      console.error('[Razorpay Webhook] ❌ INVALID SIGNATURE', {
        timestamp: new Date().toISOString(),
        bodyLength: rawBody.length,
        signaturePrefix: receivedSignature.substring(0, 20) + '...',
      });
      
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    console.log('[Razorpay Webhook] ✅ Signature verified successfully');

    // 5. Parse webhook payload (ONLY after signature verification)
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    console.log(`[Razorpay Webhook] Processing event: ${event}`);

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

    // 7. Success - acknowledge webhook receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Razorpay Webhook] Unexpected error:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    // Return 500 for unexpected errors (Razorpay will retry)
    // This helps catch genuine bugs vs signature issues
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
