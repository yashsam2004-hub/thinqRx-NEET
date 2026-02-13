import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";

// Validation schema
const CreateOrderSchema = z.object({
  planId: z.enum(['PLUS', 'PRO']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
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

    // 3. SINGLE SOURCE OF TRUTH: Fetch price from `plans` table in database
    const adminSupabase = createSupabaseAdminClient();
    const { data: plan, error: planError } = await adminSupabase
      .from('plans')
      .select('price, name, validity_days')
      .eq('id', planId.toLowerCase())
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[CreateOrder] Plan not found in DB:', planId, planError);
      return NextResponse.json(
        { error: 'Selected plan not found or inactive.' },
        { status: 400 }
      );
    }

    // Price from DB is the monthly price. Calculate based on billing cycle.
    let amountInINR: number;
    if (billingCycle === 'ANNUAL') {
      amountInINR = Math.round(plan.price * 12 * 0.8); // 20% annual discount
    } else {
      amountInINR = plan.price;
    }
    const amountInPaise = amountInINR * 100;

    // 4. Validate environment variables
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[CreateOrder] CRITICAL: Razorpay credentials missing');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 5. Validate amount
    if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
      console.error('[CreateOrder] Invalid amount:', { amountInINR, amountInPaise });
      return NextResponse.json(
        { error: 'Invalid payment amount calculated' },
        { status: 400 }
      );
    }

    console.log('[CreateOrder] Creating order:', { 
      user: user.email, 
      plan: planId, 
      planName: plan.name,
      dbPrice: plan.price,
      cycle: billingCycle, 
      amountINR: amountInINR, 
      amountPaise: amountInPaise 
    });

    // 6. Initialize Razorpay
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // 7. Create order
    const shortUserId = user.id.split('-')[0];
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `rcpt_${timestamp}_${shortUserId}`;
    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        user_id: user.id,
        user_email: user.email || '',
        plan: planId,
        billing_cycle: billingCycle,
      },
    });

    console.log(`[CreateOrder] Order created: ${order.id}, amount: ₹${amountInINR}`);

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
        created_at: new Date().toISOString(),
        razorpay_payment_id: null,
        completed_at: null,
        notes: null,
      });

    if (dbError) {
      console.error('[CreateOrder] DB insert failed (non-fatal):', dbError.message);
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
    console.error('[CreateOrder] Error:', error?.message);
    return NextResponse.json(
      { error: 'Failed to create payment order', message: error?.message },
      { status: 500 }
    );
  }
}
