"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext'; // Use AuthContext user

interface SubscriptionData {
  plan: 'Free' | 'Plus' | 'Pro';
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  endDate: Date | null;
  billingCycle: 'MONTHLY' | 'ANNUAL' | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  isSubscribed: boolean;
  isPro: boolean;
  isPlus: boolean;
  isPlusOrHigher: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Subscription Provider
 * 
 * Manages user subscription state globally
 * Uses AuthContext for user state to avoid duplicate listeners
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Get user from AuthContext
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * CRITICAL FIX: Fetch subscription from course_enrollments (NOT profiles)
   * - profiles table doesn't have subscription columns (causes 400 error)
   * - Subscription data is in course_enrollments table
   * - Fall back to FREE plan if query fails (don't block UI)
   */
  const fetchSubscription = useCallback(async (userId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();

      // Get active course enrollment with subscription data
      const { data: enrollment, error } = await supabase
        .from('course_enrollments')
        .select('plan, status, valid_until, billing_cycle')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle to avoid error if no enrollment exists

      if (error) {
        console.error('[Subscription] Failed to fetch enrollment:', error);
        // CRITICAL: Return FREE plan instead of null to avoid blocking payment page
        return {
          plan: 'Free' as const,
          status: 'inactive' as const,
          endDate: null,
          billingCycle: null,
        };
      }

      if (!enrollment) {
        // No enrollment = FREE user
        return {
          plan: 'Free' as const,
          status: 'inactive' as const,
          endDate: null,
          billingCycle: null,
        };
      }

      // Parse enrollment data
      // CRITICAL: DB stores lowercase ('free','plus','pro') but context uses capitalized
      const planRaw = (enrollment.plan || 'free').toLowerCase();
      const planMap: Record<string, 'Free' | 'Plus' | 'Pro'> = {
        free: 'Free',
        plus: 'Plus',
        pro: 'Pro',
        PLUS: 'Plus',
        PRO: 'Pro',
        FREE: 'Free',
      };
      const subscriptionData: SubscriptionData = {
        plan: planMap[planRaw] || 'Free',
        status: (enrollment.status || 'inactive') as 'active' | 'inactive' | 'expired' | 'cancelled',
        endDate: enrollment.valid_until ? new Date(enrollment.valid_until) : null,
        billingCycle: enrollment.billing_cycle as 'MONTHLY' | 'ANNUAL' | null,
      };

      // Check if subscription is expired
      if (subscriptionData.endDate && subscriptionData.endDate < new Date()) {
        subscriptionData.status = 'expired';
      }

      return subscriptionData;
    } catch (error) {
      console.error('[Subscription] Error fetching subscription:', error);
      // CRITICAL: Always return FREE plan on error to prevent blocking
      return {
        plan: 'Free' as const,
        status: 'inactive' as const,
        endDate: null,
        billingCycle: null,
      };
    }
  }, []);

  /**
   * Refresh subscription data
   */
  const refreshSubscription = useCallback(async () => {
    if (!user) return;

    console.log('[Subscription] Refreshing subscription data...');
    const data = await fetchSubscription(user.id);
    setSubscription(data);
  }, [user, fetchSubscription]);

  /**
   * CRITICAL FIX: Use AuthContext user instead of registering separate auth listener
   * - Prevents duplicate auth listeners (AuthContext already handles this)
   * - Only fetch subscription when user changes
   * - Avoids infinite loop from fetchSubscription dependency
   * - Defaults to FREE plan if fetch fails (doesn't block payment page)
   */
  useEffect(() => {
    if (!user) {
      // No user = FREE plan, stop loading immediately
      setSubscription({
        plan: 'Free',
        status: 'inactive',
        endDate: null,
        billingCycle: null,
      });
      setLoading(false);
      return;
    }

    // Fetch subscription for current user
    console.log('[Subscription] Fetching subscription for user:', user.id);
    fetchSubscription(user.id).then((data) => {
      // data is always non-null now (fallback to FREE on error)
      setSubscription(data);
      setLoading(false);
    });
  }, [user?.id, fetchSubscription]); // Added fetchSubscription back since it's stable with useCallback

  // Helper: Check if user has any active subscription
  const isSubscribed = React.useMemo(() => {
    // CRITICAL: Check if subscription exists before accessing properties
    if (!subscription || subscription.plan === 'Free') return false;
    return (
      subscription.status === 'active' &&
      subscription.endDate !== null &&
      subscription.endDate > new Date()
    );
  }, [subscription]);

  // Helper: Check if user is Pro
  const isPro = React.useMemo(() => {
    if (!subscription) return false;
    return (
      subscription.plan === 'Pro' &&
      subscription.status === 'active' &&
      subscription.endDate !== null &&
      subscription.endDate > new Date()
    );
  }, [subscription]);

  // Helper: Check if user is Plus
  const isPlus = React.useMemo(() => {
    if (!subscription) return false;
    return (
      subscription.plan === 'Plus' &&
      subscription.status === 'active' &&
      subscription.endDate !== null &&
      subscription.endDate > new Date()
    );
  }, [subscription]);

  // Helper: Check if user is Plus or higher
  const isPlusOrHigher = React.useMemo(() => {
    return isPlus || isPro;
  }, [isPlus, isPro]);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    isSubscribed,
    isPro,
    isPlus,
    isPlusOrHigher,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to use subscription context
 * 
 * Usage:
 * ```tsx
 * const { isPro, isPlus, subscription } = useSubscription();
 * 
 * if (isPro) {
 *   // Show premium content
 * }
 * ```
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  
  return context;
}
