import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { clearPlansCache } from '@/lib/plans/features';

// Update a plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { planId, updates } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to update the plan (bypasses RLS)
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from('plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select();

    if (error) {
      console.error('[Admin Plans API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update plan', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Admin Plans API] Plan updated successfully:', data);

    // CRITICAL: Clear the plans cache so changes take effect immediately
    clearPlansCache();
    console.log('[Admin Plans API] Plans cache cleared');

    return NextResponse.json({ 
      success: true,
      message: 'Plan updated successfully',
      data
    });
  } catch (error) {
    console.error('[Admin Plans API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Toggle plan active status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { planId, isActive } = await request.json();

    if (!planId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Plan ID and isActive status are required' },
        { status: 400 }
      );
    }

    // Use admin client to update plan status (bypasses RLS)
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from('plans')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select();

    if (error) {
      console.error('[Admin Plans API] Toggle error:', error);
      return NextResponse.json(
        { error: 'Failed to update plan status', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Admin Plans API] Plan status updated successfully:', data);

    // CRITICAL: Clear the plans cache so changes take effect immediately
    clearPlansCache();
    console.log('[Admin Plans API] Plans cache cleared');

    return NextResponse.json({ 
      success: true,
      message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      data
    });
  } catch (error) {
    console.error('[Admin Plans API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
