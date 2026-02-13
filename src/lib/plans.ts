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
 */
export function getFeaturesList(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features;

  const list: string[] = [];
  if (features.ai_notes_limit) {
    list.push(features.ai_notes_limit === 999 ? "Unlimited AI Notes" : `${features.ai_notes_limit} AI Notes`);
  }
  if (features.practice_tests_limit) {
    list.push(features.practice_tests_limit === 999 ? "Unlimited Practice Tests" : `${features.practice_tests_limit} Practice Tests`);
  }
  if (features.explanations) {
    list.push(`${features.explanations === "full" ? "Full" : "Partial"} Explanations`);
  }
  if (features.analytics) {
    list.push(`${features.analytics === "advanced" ? "Advanced" : "Basic"} Analytics`);
  }
  if (features.best_for) {
    list.push(`Best for: ${features.best_for}`);
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
