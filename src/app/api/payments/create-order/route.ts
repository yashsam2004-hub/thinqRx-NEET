import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Validation schema
const CreateOrderSchema = z.object({
  planId: z.enum(['PLUS', 'PRO']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
});

// Pricing map (in INR)
const PRICING = {
  PLUS_MONTHLY: 199,
  PRO_MONTHLY: 299,
  PLUS_ANNUAL: Math.round(199 * 12 * 0.8), // 20% discount: 1,910
  PRO_ANNUAL: Math.round(299 * 12 * 0.8),  // 20% discount: 2,869
} as const;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = CreateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = validation.data;

    // 3. Calculate amount
    const priceKey = `${planId}_${billingCycle}` as keyof typeof PRICING;
    const amountInINR = PRICING[priceKey];
    const amountInPaise = amountInINR * 100; // Convert to paise

    // 4. Validate environment variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 5. Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 6. Create order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email || '',
        plan: planId,
        billing_cycle: billingCycle,
      },
    });

    // 7. Log order creation (for debugging/audit)
    console.log(`[Razorpay] Order created: ${order.id} for user ${user.email}`);

    // 8. Store pending payment in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        plan_name: planId,
        billing_cycle: billingCycle,
        amount: amountInINR,
        currency: 'INR',
        status: 'pending',
      });

    if (dbError) {
      console.error('[Razorpay] Failed to store pending payment:', dbError);
      // Don't fail the request, order is created
    }

    // 9. Return order details (NEVER expose key_secret)
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: amountInPaise,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (error: any) {
    console.error('[Razorpay] Order creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
