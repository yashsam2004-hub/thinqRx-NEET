/**
 * SINGLE SOURCE OF TRUTH: Shared plan types and fetching logic.
 *
 * Used by:
 *  - /pricing page (server-side)
 *  - /upgrade page (client-side)
 *  - /api/payments/create-order (server-side validation)
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  description: string;
  features: any;
  is_active: boolean;
  display_order: number;
  plan_category: string; // 'subscription' | 'exam_pack'
}

/**
 * Parse the features JSON from the plans table into a flat string array
 * suitable for display in cards.
 * 
 * FULLY DYNAMIC - Reads all features from database and displays them intelligently.
 * Admin can edit these in the /admin/plans panel.
 */
export function getFeaturesList(features: any): string[] {
  if (!features) return [];
  
  // If features is already an array of strings, return as-is
  if (Array.isArray(features)) return features;

  const list: string[] = [];
  
  // AI Notes Limit
  if (features.ai_notes_limit !== undefined && features.ai_notes_limit !== null) {
    if (features.ai_notes_limit === -1) {
      list.push("✨ Unlimited AI Notes");
    } else if (features.ai_notes_limit > 0) {
      list.push(`📝 ${features.ai_notes_limit} AI Notes per day`);
    }
  }
  
  // Practice Tests Limit
  if (features.practice_tests_limit !== undefined && features.practice_tests_limit !== null) {
    if (features.practice_tests_limit === -1) {
      list.push("✨ Unlimited Practice Tests");
    } else if (features.practice_tests_limit > 0) {
      list.push(`📚 ${features.practice_tests_limit} Practice Tests per day`);
    }
  }
  
  // Mock Tests Access
  if (features.mock_tests_access) {
    if (features.mock_tests_limit === -1) {
      list.push("🎯 Unlimited Mock Tests");
    } else if (features.mock_tests_limit && features.mock_tests_limit > 0) {
      list.push(`🎯 ${features.mock_tests_limit} Mock Tests per month`);
    } else {
      list.push("🎯 Full Mock Test Access");
    }
  }
  
  // Premium Content Access
  if (features.can_access_premium_content) {
    list.push("🔓 All Premium Topics");
  }
  
  // Explanations Level
  if (features.explanations) {
    const explType = features.explanations === "full" ? "Full & Detailed" : 
                     features.explanations === "partial" ? "Partial" : 
                     "Basic";
    list.push(`💡 ${explType} Explanations`);
  }
  
  // Analytics Level
  if (features.analytics) {
    const analyticsType = features.analytics === "advanced" ? "Advanced" : "Basic";
    list.push(`📊 ${analyticsType} Analytics`);
  }
  
  // Regenerate Notes
  if (features.regenerate_notes) {
    list.push("🔄 Regenerate AI Notes");
  }
  
  // Custom "Best For" text (always show last if present)
  if (features.best_for) {
    list.push(`✅ Best for: ${features.best_for}`);
  }
  
  return list;
}

/**
 * Format validity days into a human-readable string.
 */
export function formatValidity(days: number): string {
  if (days >= 9999) return "Lifetime access";
  if (days === 365) return "Valid for 1 year";
  if (days < 365) return `Valid for ${days} days`;
  const years = Math.floor(days / 365);
  return `Valid for ${years} ${years === 1 ? "year" : "years"}`;
}
