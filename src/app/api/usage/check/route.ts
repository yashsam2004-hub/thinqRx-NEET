/**
 * API endpoint to check feature usage limits
 * POST /api/usage/check
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkFeatureAccess, type CounterType } from '@/lib/usage-limits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { counterType } = body as { counterType: CounterType };

    if (!counterType) {
      return NextResponse.json(
        { error: 'counterType is required' },
        { status: 400 }
      );
    }

    // Check feature access
    const access = await checkFeatureAccess(user.id, counterType);

    return NextResponse.json(access);
  } catch (error) {
    console.error('[Usage Check API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all usage stats
    const { getUserUsageStats } = await import('@/lib/usage-limits');
    const stats = await getUserUsageStats(user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Usage Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
