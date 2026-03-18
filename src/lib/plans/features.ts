/**
 * Dynamic Plan Features Service
 * 
 * Provides centralized access to plan features from the database.
 * This replaces hardcoded plan limits throughout the codebase.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PlanFeatures {
  ai_notes_limit: number;           // -1 = unlimited, 0 = none, N = daily limit
  practice_tests_limit: number;     // -1 = unlimited, 0 = none, N = daily limit
  mock_tests_limit?: number;        // -1 = unlimited, 0 = none, N = monthly limit
  mock_tests_access?: boolean;      // Direct access flag
  explanations?: string;            // 'none' | 'partial' | 'full'
  analytics?: string;               // 'none' | 'basic' | 'advanced'
  can_access_premium_content?: boolean; // Access to non-free topics
  regenerate_notes?: boolean;       // Can regenerate AI notes
  [key: string]: any;               // Allow other custom features
}

export interface PlanWithFeatures {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  description: string;
  features: PlanFeatures;
  is_active: boolean;
  display_order: number;
  plan_category: string;
}

// In-memory cache for plan features (refreshed periodically)
let plansCache: PlanWithFeatures[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active plans from database
 */
async function fetchAllPlans(useBrowser = false): Promise<PlanWithFeatures[]> {
  try {
    const supabase = useBrowser 
      ? createSupabaseBrowserClient()
      : await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) {
      console.error('[PlanFeatures] Failed to fetch plans:', error);
      return getDefaultPlans();
    }
    
    return data || getDefaultPlans();
  } catch (error) {
    console.error('[PlanFeatures] Error fetching plans:', error);
    return getDefaultPlans();
  }
}

/**
 * Get plan features with caching
 */
export async function getPlanFeatures(
  planId: string,
  useBrowser = false
): Promise<PlanFeatures> {
  // Normalize plan ID to lowercase
  const normalizedPlanId = planId.toLowerCase();
  
  // Check if cache is valid
  const now = Date.now();
  if (!plansCache || (now - lastFetchTime) > CACHE_TTL) {
    plansCache = await fetchAllPlans(useBrowser);
    lastFetchTime = now;
  }
  
  // Find plan in cache
  const plan = plansCache.find(p => p.id.toLowerCase() === normalizedPlanId);
  
  if (plan?.features) {
    return plan.features;
  }
  
  // Fallback to default features for this plan
  console.warn(`[PlanFeatures] Plan '${planId}' not found, using defaults`);
  return getDefaultFeaturesForPlan(normalizedPlanId);
}

/**
 * Get all active plans
 */
export async function getAllPlans(useBrowser = false): Promise<PlanWithFeatures[]> {
  const now = Date.now();
  if (!plansCache || (now - lastFetchTime) > CACHE_TTL) {
    plansCache = await fetchAllPlans(useBrowser);
    lastFetchTime = now;
  }
  return plansCache;
}

/**
 * Clear the plans cache (useful after admin updates)
 */
export function clearPlansCache(): void {
  plansCache = null;
  lastFetchTime = 0;
}

/**
 * Check if a plan is a paid plan (not free)
 */
export function isPaidPlan(planId: string): boolean {
  return planId.toLowerCase() !== 'free';
}

/**
 * Check if plan has mock test access
 * Rule: All paid plans EXCEPT 'plus' and 'free'
 */
export async function hasMockTestAccess(planId: string, useBrowser = false): Promise<boolean> {
  const normalizedPlanId = planId.toLowerCase();
  
  // Free and Plus users: NO mock tests
  if (normalizedPlanId === 'free' || normalizedPlanId === 'plus') {
    return false;
  }
  
  // Check if plan features explicitly define mock_tests_access
  const features = await getPlanFeatures(planId, useBrowser);
  if (typeof features.mock_tests_access === 'boolean') {
    return features.mock_tests_access;
  }
  
  // Default: All other paid plans have mock test access
  return isPaidPlan(normalizedPlanId);
}

/**
 * Check if plan can access premium content (non-free topics)
 * Rule: All paid plans can access premium content
 */
export function canAccessPremiumContent(planId: string): boolean {
  return isPaidPlan(planId);
}

/**
 * Default features for known plans (fallback)
 */
function getDefaultFeaturesForPlan(planId: string): PlanFeatures {
  switch (planId) {
    case 'free':
      return {
        ai_notes_limit: 5,
        practice_tests_limit: 3,
        mock_tests_limit: 0,
        mock_tests_access: false,
        explanations: 'none',
        analytics: 'none',
        can_access_premium_content: false,
      };
    
    case 'plus':
      return {
        ai_notes_limit: -1, // unlimited
        practice_tests_limit: -1,
        mock_tests_limit: 0, // no mock tests
        mock_tests_access: false,
        explanations: 'partial',
        analytics: 'basic',
        can_access_premium_content: true,
      };
    
    case 'pro':
      return {
        ai_notes_limit: -1,
        practice_tests_limit: -1,
        mock_tests_limit: -1,
        mock_tests_access: true,
        explanations: 'full',
        analytics: 'advanced',
        can_access_premium_content: true,
        regenerate_notes: true,
      };
    
    case 'neet_crash_course':
      return {
        ai_notes_limit: 50,
        practice_tests_limit: 10,
        mock_tests_limit: -1, // unlimited mock tests
        mock_tests_access: true,
        explanations: 'partial',
        analytics: 'basic',
        can_access_premium_content: true,
      };
    
    case 'neet_full':
      return {
        ai_notes_limit: -1,
        practice_tests_limit: -1,
        mock_tests_limit: -1,
        mock_tests_access: true,
        explanations: 'full',
        analytics: 'advanced',
        can_access_premium_content: true,
        regenerate_notes: true,
      };
    
    default:
      // Unknown paid plan: Give full access
      if (isPaidPlan(planId)) {
        return {
          ai_notes_limit: -1,
          practice_tests_limit: -1,
          mock_tests_limit: -1,
          mock_tests_access: true,
          explanations: 'full',
          analytics: 'advanced',
          can_access_premium_content: true,
        };
      }
      
      // Unknown plan: Treat as free
      return {
        ai_notes_limit: 5,
        practice_tests_limit: 3,
        mock_tests_limit: 0,
        mock_tests_access: false,
        explanations: 'none',
        analytics: 'none',
        can_access_premium_content: false,
      };
  }
}

/**
 * Default plans (fallback if database is unavailable)
 */
function getDefaultPlans(): PlanWithFeatures[] {
  return [
    {
      id: 'neet_full',
      name: 'NEET Full Prep',
      price: 999,
      validity_days: 365,
      description: 'Complete NEET UG preparation',
      features: getDefaultFeaturesForPlan('neet_full'),
      is_active: true,
      display_order: 1,
      plan_category: 'exam_pack',
    },
    {
      id: 'neet_crash_course',
      name: 'NEET Crash Course Pack',
      price: 299,
      validity_days: 60,
      description: 'High-yield revision',
      features: getDefaultFeaturesForPlan('neet_crash_course'),
      is_active: true,
      display_order: 2,
      plan_category: 'exam_pack',
    },
    {
      id: 'plus',
      name: 'Plus Plan',
      price: 199,
      validity_days: 31,
      description: 'Monthly subscription',
      features: getDefaultFeaturesForPlan('plus'),
      is_active: true,
      display_order: 3,
      plan_category: 'subscription',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 299,
      validity_days: 31,
      description: 'All features',
      features: getDefaultFeaturesForPlan('pro'),
      is_active: true,
      display_order: 4,
      plan_category: 'subscription',
    },
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      validity_days: 9999,
      description: 'Basic access',
      features: getDefaultFeaturesForPlan('free'),
      is_active: true,
      display_order: 5,
      plan_category: 'subscription',
    },
  ];
}
