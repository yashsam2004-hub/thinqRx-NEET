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
    // Try both possible env var names (with and without NEXT_PUBLIC prefix)
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Razorpay] CRITICAL: Credentials missing in environment');
      console.error('[Razorpay] Checked env vars: RAZORPAY_KEY_ID, NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET');
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
      // CRITICAL FIX: Razorpay receipt max 40 chars
      // Format: rcpt_TIMESTAMP_SHORTID (under 40 chars)
      const shortUserId = user.id.split('-')[0]; // First 8 chars of UUID
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const receipt = `rcpt_${timestamp}_${shortUserId}`; // ~25 chars total
      
      console.log('[Razorpay] Creating order with receipt:', receipt);
      
      order = await razorpay.orders.create({
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
    } catch (razorpayError: any) {
      console.error('[Razorpay] Order creation failed:', {
        statusCode: razorpayError?.statusCode,
        message: razorpayError?.error?.description || razorpayError?.message,
        code: razorpayError?.error?.code,
        field: razorpayError?.error?.field, // Shows which field caused error
        reason: razorpayError?.error?.reason, // Detailed reason
        // Note: Full error object not logged to avoid exposing sensitive data
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

    // 8. Log successful order creation (for debugging/audit)
    console.log(`[Razorpay] ✅ Order created successfully: ${order.id} for user ${user.email}`);

    // 9. Store pending payment in database (for tracking and reconciliation)
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
        // Explicitly set nullable fields to avoid NOT NULL violations
        razorpay_payment_id: null,
        completed_at: null,
        notes: null,
      });

    if (dbError) {
      console.error('[Razorpay] Failed to store pending payment in DB:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
      });
      // IMPORTANT: Don't fail the request - Razorpay order is already created
      // Payment can still be tracked via webhook
      
      // Return warning in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Razorpay] ⚠️  Payment created but not stored in DB. Check database schema.');
      }
    } else {
      console.log('[Razorpay] ✅ Payment record stored in database');
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
    // CRITICAL: Catch any unhandled errors (network, parsing, etc.)
    // SECURITY: Don't expose full stack trace in production
    console.error('[Razorpay] Unexpected error in order creation flow:', {
      name: error?.name,
      message: error?.message,
      // Stack trace only logged server-side, never sent to client
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order', 
        message: process.env.NODE_ENV === 'development' ? error?.message : 'An error occurred',
        type: error?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}
