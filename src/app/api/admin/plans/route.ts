import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

    // Update the plan
    const { error } = await supabase
      .from('plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      console.error('[Admin Plans API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    // No cache invalidation needed - pricing page is now fully dynamic

    return NextResponse.json({ 
      success: true,
      message: 'Plan updated successfully' 
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

    // Update plan status
    const { error } = await supabase
      .from('plans')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      console.error('[Admin Plans API] Toggle error:', error);
      return NextResponse.json(
        { error: 'Failed to update plan status' },
        { status: 500 }
      );
    }

    // No cache invalidation needed - pricing page is now fully dynamic

    return NextResponse.json({ 
      success: true,
      message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('[Admin Plans API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
