import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkDeviceLimit } from '@/lib/auth/deviceLimit';
import { z } from 'zod';

export const dynamic = "force-dynamic";

// Validation schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * 
 * Login with device limit enforcement
 * - Authenticates user with Supabase
 * - Checks device limit (max 2 devices)
 * - Registers new device or updates existing
 * - Prevents login on 3rd+ device
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    
    console.log('[Login] Attempting login for:', email);
    
    // 2. Authenticate with Supabase
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[Login] Authentication failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (!data.user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('[Login] Authentication successful, checking device limit');
    
    // 3. Check device limit AFTER successful auth
    const deviceCheck = await checkDeviceLimit(data.user.id);
    
    if (!deviceCheck.allowed) {
      console.log('[Login] Device limit exceeded, logging out');
      
      // Logout immediately
      await supabase.auth.signOut();
      
      return NextResponse.json({
        error: 'device_limit_exceeded',
        message: deviceCheck.message,
        deviceCount: deviceCheck.deviceCount
      }, { status: 403 });
    }
    
    console.log('[Login] Login successful, device registered');
    
    // 4. Return success (session is set via cookies automatically)
    return NextResponse.json({ 
      success: true,
      message: 'Login successful'
    });
    
  } catch (err: any) {
    console.error('[Login] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An error occurred during login', message: err?.message },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
