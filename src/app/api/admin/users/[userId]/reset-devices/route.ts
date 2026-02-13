import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resetUserDevices } from '@/lib/auth/deviceLimit';

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[userId]/reset-devices
 * 
 * Admin-only endpoint to reset all devices for a user
 * - Deactivates all registered devices
 * - Allows user to login fresh on new devices
 * - Requires admin role
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Verify admin authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('[ResetDevices] Non-admin user attempted to reset devices:', user.email);
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 3. Await params and validate userId parameter
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[ResetDevices] Admin', user.email, 'resetting devices for user:', userId);

    // 4. Reset all devices for the user
    const result = await resetUserDevices(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset devices' },
        { status: 500 }
      );
    }

    console.log('[ResetDevices] Successfully reset devices for user:', userId);

    // 5. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'All devices reset successfully. User can now login on new devices.' 
    });

  } catch (err: any) {
    console.error('[ResetDevices] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An error occurred while resetting devices', message: err?.message },
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
