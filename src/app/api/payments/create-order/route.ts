import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

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

    // 3. Calculate amount
    const priceKey = `${planId}_${billingCycle}` as keyof typeof PRICING;
    const amountInINR = PRICING[priceKey];
    const amountInPaise = amountInINR * 100; // Convert to paise

    // 4. Validate environment variables (CRITICAL FIX: Check before Razorpay init)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Razorpay] CRITICAL: Credentials missing in environment');
      console.error('[Razorpay] KEY_ID present:', !!keyId);
      console.error('[Razorpay] KEY_SECRET present:', !!keySecret);
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 5. Validate amount before sending to Razorpay (CRITICAL FIX: Prevent invalid amount errors)
    if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
      console.error('[Razorpay] Invalid amount calculated:', { amountInINR, amountInPaise, priceKey });
      return NextResponse.json(
        { error: 'Invalid payment amount calculated' },
        { status: 400 }
      );
    }

    console.log('[Razorpay] Creating order:', { 
      user: user.email, 
      plan: planId, 
      cycle: billingCycle, 
      amountINR: amountInINR, 
      amountPaise: amountInPaise 
    });

    // 6. Initialize Razorpay (moved after validation for better error reporting)
    let razorpay;
    try {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (initError: any) {
      console.error('[Razorpay] SDK initialization failed:', initError);
      return NextResponse.json(
        { error: 'Failed to initialize payment gateway', message: initError.message },
        { status: 500 }
      );
    }

    // 7. Create order with explicit error handling
    let order;
    try {
      order = await razorpay.orders.create({
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
    } catch (razorpayError: any) {
      console.error('[Razorpay] Order creation failed:', {
        error: razorpayError,
        statusCode: razorpayError?.statusCode,
        message: razorpayError?.error?.description || razorpayError?.message,
        details: razorpayError?.error
      });
      
      // Return Razorpay-specific error to help debug
      return NextResponse.json(
        { 
          error: 'Razorpay order creation failed', 
          message: razorpayError?.error?.description || razorpayError?.message || 'Unknown Razorpay error',
          code: razorpayError?.error?.code || razorpayError?.statusCode
        },
        { status: 500 }
      );
    }

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
      console.error('[Razorpay] Failed to store pending payment in DB:', dbError);
      // IMPORTANT: Don't fail the request - Razorpay order is already created
      // Payment can still be tracked via webhook
    }

    // 10. Return order details to frontend (NEVER expose key_secret)
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: amountInPaise,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (error: any) {
    // CRITICAL FIX: Catch any unhandled errors (network, parsing, etc.)
    console.error('[Razorpay] Unexpected error in order creation flow:', {
      error,
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order', 
        message: error?.message || 'Unknown error',
        type: error?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}
