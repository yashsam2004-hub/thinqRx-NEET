/**
 * Usage Limits & Entitlements
 * Manages feature access based on user's plan
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export type CounterType = 'ai_notes' | 'practice_tests' | 'explanations' | 'analytics_depth';

export interface UsageCounter {
  id: string;
  user_id: string;
  plan_id: string;
  counter_type: CounterType;
  count: number;
  limit: number;
  reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  ai_notes_limit: number;
  practice_tests_limit: number;
  explanations: 'none' | 'partial' | 'full';
  analytics: 'none' | 'basic' | 'advanced';
  regenerate_notes: boolean;
}

/**
 * Get plan limits from features JSONB
 */
export function getPlanLimits(plan: any): PlanLimits {
  const features = plan.features || {};
  
  return {
    ai_notes_limit: features.ai_notes_limit || 5,
    practice_tests_limit: features.practice_tests_limit || 1,
    explanations: features.explanations || 'none',
    analytics: features.analytics || 'none',
    regenerate_notes: features.regenerate_notes || false,
  };
}

/**
 * Check if user can access a feature
 * Returns { allowed: boolean, remaining: number, message?: string }
 */
export async function checkFeatureAccess(
  userId: string,
  counterType: CounterType
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get user's current plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { allowed: false, remaining: 0, message: 'User not found' };
    }

    const planId = profile.subscription_plan || 'free';

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return { allowed: false, remaining: 0, message: 'Plan not found' };
    }

    const limits = getPlanLimits(plan);

    // Get usage counter
    const { data: counter } = await supabase
      .from('usage_counters')
      .select('*')
      .eq('user_id', userId)
      .eq('counter_type', counterType)
      .maybeSingle();

    // Map counter type to limit
    let limit = 0;
    if (counterType === 'ai_notes') limit = limits.ai_notes_limit;
    else if (counterType === 'practice_tests') limit = limits.practice_tests_limit;
    else if (counterType === 'explanations') limit = limits.explanations === 'full' ? 999 : 10;
    else if (counterType === 'analytics_depth') limit = limits.analytics === 'advanced' ? 999 : 5;

    if (!counter) {
      // No counter yet, user can access
      return { allowed: true, remaining: limit };
    }

    const remaining = limit - counter.count;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining: Math.max(0, remaining),
      message: allowed ? undefined : `You've reached your ${counterType.replace('_', ' ')} limit`,
    };
  } catch (error) {
    console.error('[Usage Limits] Error checking feature access:', error);
    return { allowed: true, remaining: 0 }; // Fail open to not block users on error
  }
}

/**
 * Increment usage counter (server-side only)
 */
export async function incrementUsage(
  userId: string,
  planId: string,
  counterType: CounterType
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    // Get plan limits
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) return false;

    const limits = getPlanLimits(plan);

    // Determine limit for this counter type
    let limit = 0;
    if (counterType === 'ai_notes') limit = limits.ai_notes_limit;
    else if (counterType === 'practice_tests') limit = limits.practice_tests_limit;
    else if (counterType === 'explanations') limit = limits.explanations === 'full' ? 999 : 10;
    else if (counterType === 'analytics_depth') limit = limits.analytics === 'advanced' ? 999 : 5;

    // Call the increment_usage function
    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_plan_id: planId,
      p_counter_type: counterType,
      p_limit: limit,
    });

    if (error) {
      console.error('[Usage Limits] Error incrementing usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Usage Limits] Error incrementing usage:', error);
    return false;
  }
}

/**
 * Get all usage stats for a user (for dashboard)
 */
export async function getUserUsageStats(userId: string): Promise<{
  ai_notes: { used: number; limit: number };
  practice_tests: { used: number; limit: number };
  explanations: { used: number; limit: number };
}> {
  try {
    const supabase = createServerSupabaseClient();

    // Get user's plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    const planId = profile?.subscription_plan || 'free';

    // Get plan limits
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    const limits = plan ? getPlanLimits(plan) : {
      ai_notes_limit: 5,
      practice_tests_limit: 1,
      explanations: 'none' as const,
      analytics: 'none' as const,
      regenerate_notes: false,
    };

    // Get usage counters
    const { data: counters } = await supabase
      .from('usage_counters')
      .select('*')
      .eq('user_id', userId);

    const aiNotesCounter = counters?.find(c => c.counter_type === 'ai_notes');
    const testsCounter = counters?.find(c => c.counter_type === 'practice_tests');
    const explanationsCounter = counters?.find(c => c.counter_type === 'explanations');

    return {
      ai_notes: {
        used: aiNotesCounter?.count || 0,
        limit: limits.ai_notes_limit,
      },
      practice_tests: {
        used: testsCounter?.count || 0,
        limit: limits.practice_tests_limit,
      },
      explanations: {
        used: explanationsCounter?.count || 0,
        limit: limits.explanations === 'full' ? 999 : 10,
      },
    };
  } catch (error) {
    console.error('[Usage Limits] Error getting usage stats:', error);
    return {
      ai_notes: { used: 0, limit: 5 },
      practice_tests: { used: 0, limit: 1 },
      explanations: { used: 0, limit: 0 },
    };
  }
}

/**
 * Client-side hook to check feature access (React)
 */
export async function checkFeatureAccessClient(
  counterType: CounterType
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { allowed: false, remaining: 0, message: 'Not authenticated' };
    }

    // Call API endpoint to check access
    const response = await fetch('/api/usage/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counterType }),
    });

    if (!response.ok) {
      return { allowed: false, remaining: 0, message: 'Error checking access' };
    }

    return await response.json();
  } catch (error) {
    console.error('[Usage Limits] Error checking feature access:', error);
    return { allowed: true, remaining: 0 }; // Fail open
  }
}
