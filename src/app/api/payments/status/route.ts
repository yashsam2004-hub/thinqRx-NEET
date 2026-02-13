import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/status?order_id=order_xxx
 * 
 * Check payment status for an order by querying Razorpay directly
 * Used for polling QR/UPI payments that don't have immediate frontend callback
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get order_id from query params
    const orderId = req.nextUrl.searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order_id parameter' },
        { status: 400 }
      );
    }

    // 3. Initialize Razorpay
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Payment Status] Missing Razorpay credentials');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 4. Fetch payments for this order from Razorpay
    console.log('[Payment Status] Checking order:', orderId);
    const paymentsResponse = await razorpay.orders.fetchPayments(orderId);
    const payments = paymentsResponse.items || [];

    if (payments.length === 0) {
      return NextResponse.json({
        status: 'pending',
        message: 'No payments found for this order yet',
      });
    }

    // 5. Get the most recent payment
    const payment = payments[0];

    console.log('[Payment Status] Payment found:', {
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
    });

    // 6. Check if payment is captured (successful)
    if (payment.status === 'captured') {
      return NextResponse.json({
        status: 'paid',
        payment_id: payment.id,
        order_id: orderId,
        amount: payment.amount,
        method: payment.method,
      });
    }

    // 7. Payment exists but not captured yet
    return NextResponse.json({
      status: payment.status, // 'created', 'authorized', 'failed', etc.
      payment_id: payment.id,
      order_id: orderId,
    });

  } catch (error: any) {
    console.error('[Payment Status] Error checking status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        message: error?.message 
      },
      { status: 500 }
    );
  }
}
