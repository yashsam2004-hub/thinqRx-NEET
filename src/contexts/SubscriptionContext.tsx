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
   * Fetch user subscription from Supabase
   */
  const fetchSubscription = useCallback(async (userId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_end_date, billing_cycle')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Subscription] Failed to fetch subscription:', error);
        return null;
      }

      if (!profile) {
        return null;
      }

      // Parse subscription data
      const subscriptionData: SubscriptionData = {
        plan: (profile.subscription_plan || 'Free') as 'Free' | 'Plus' | 'Pro',
        status: (profile.subscription_status || 'inactive') as 'active' | 'inactive' | 'expired' | 'cancelled',
        endDate: profile.subscription_end_date ? new Date(profile.subscription_end_date) : null,
        billingCycle: profile.billing_cycle as 'MONTHLY' | 'ANNUAL' | null,
      };

      // Check if subscription is expired (client-side validation)
      if (subscriptionData.endDate && subscriptionData.endDate < new Date()) {
        subscriptionData.status = 'expired';
      }

      return subscriptionData;
    } catch (error) {
      console.error('[Subscription] Error fetching subscription:', error);
      return null;
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
   */
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Fetch subscription for current user
    console.log('[Subscription] Fetching subscription for user:', user.id);
    fetchSubscription(user.id).then((data) => {
      setSubscription(data);
      setLoading(false);
    });
  }, [user?.id]); // Only re-run when user ID changes (not fetchSubscription)

  // Helper: Check if user has any active subscription
  const isSubscribed = React.useMemo(() => {
    if (!subscription) return false;
    return (
      subscription.status === 'active' &&
      subscription.plan !== 'Free' &&
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
