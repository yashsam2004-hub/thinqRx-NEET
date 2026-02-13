import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";

// Validation schema - accepts ANY plan ID string
const CreateOrderSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.string().min(1),
});

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
    const validation = CreateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = validation.data;

    // 3. SINGLE SOURCE OF TRUTH: Fetch plan from `plans` table
    const adminSupabase = createSupabaseAdminClient();
    const { data: plan, error: planError } = await adminSupabase
      .from('plans')
      .select('id, name, price, validity_days, plan_category')
      .eq('id', planId.toLowerCase())
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[CreateOrder] Plan not found:', planId, planError);
      return NextResponse.json(
        { error: 'Selected plan not found or inactive.' },
        { status: 400 }
      );
    }

    // 4. Prevent purchase of free plan
    if (plan.price <= 0) {
      return NextResponse.json(
        { error: 'This plan is free and does not require payment.' },
        { status: 400 }
      );
    }

    // 5. Calculate amount from DB price
    // For subscription plans, support annual billing (20% discount)
    // For exam packs (one_time), use the price directly
    let amountInINR: number;
    const cycle = billingCycle.toUpperCase();

    if (plan.plan_category === 'exam_pack' || cycle === 'ONE_TIME') {
      // Exam packs: flat price, no billing cycle
      amountInINR = plan.price;
    } else if (cycle === 'ANNUAL') {
      amountInINR = Math.round(plan.price * 12 * 0.8); // 20% annual discount
    } else {
      // MONTHLY
      amountInINR = plan.price;
    }

    const amountInPaise = amountInINR * 100;

    // 6. Validate environment variables
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[CreateOrder] Razorpay credentials missing');
      return NextResponse.json(
        { error: 'Payment gateway not configured.' },
        { status: 500 }
      );
    }

    // 7. Validate amount
    if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
      console.error('[CreateOrder] Invalid amount:', { amountInINR, amountInPaise });
      return NextResponse.json(
        { error: 'Invalid payment amount calculated' },
        { status: 400 }
      );
    }

    console.log('[CreateOrder] Creating order:', {
      user: user.email,
      planId: plan.id,
      planName: plan.name,
      category: plan.plan_category,
      dbPrice: plan.price,
      cycle,
      amountINR: amountInINR,
    });

    // 8. Initialize Razorpay
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // 9. Create order
    const shortUserId = user.id.split('-')[0];
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `rcpt_${timestamp}_${shortUserId}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        user_id: user.id,
        user_email: user.email || '',
        plan: plan.id,
        plan_name: plan.name,
        billing_cycle: cycle,
      },
    });

    console.log(`[CreateOrder] Order created: ${order.id}, ₹${amountInINR}`);

    // 10. Store pending payment
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        plan_name: plan.id.toUpperCase(),
        billing_cycle: cycle,
        amount: amountInINR,
        currency: 'INR',
        status: 'pending',
        created_at: new Date().toISOString(),
        razorpay_payment_id: null,
        completed_at: null,
        notes: null,
      });

    if (dbError) {
      console.error('[CreateOrder] DB insert failed (non-fatal):', dbError.message);
    }

    // 11. Return order details
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: amountInPaise,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (error: any) {
    console.error('[CreateOrder] Error:', error?.message);
    return NextResponse.json(
      { error: 'Failed to create payment order', message: error?.message },
      { status: 500 }
    );
  }
}
