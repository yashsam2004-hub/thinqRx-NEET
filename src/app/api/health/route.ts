import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint to verify API routes are working
 */
export async function GET() {
  const envCheck = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    razorpay_key_id: !!(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    razorpay_key_secret: !!process.env.RAZORPAY_KEY_SECRET,
  };

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environment_variables: envCheck,
    api_routes: {
      health: '/api/health',
      verify_payment: '/api/payments/verify',
      create_order: '/api/payments/create-order',
    }
  });
}
