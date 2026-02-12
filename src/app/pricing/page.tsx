import Link from "next/link";
import { 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  Zap, 
  Rocket,
  Shield,
  Clock,
  Award,
  Star,
  Users,
  X,
  Target,
  TrendingUp
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { PricingCTA } from "@/components/PricingCTA";

// Make pricing page dynamic (no caching) so updates appear immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Plan {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  description: string;
  features: any;
  is_active: boolean;
  display_order: number;
  plan_category: string;
}

// Anonymous Supabase client for public data (no cookies, fully cacheable)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch plans dynamically (no cache) for immediate updates
async function getPlans(): Promise<Plan[]> {
  try {
    const { data: plans } = await supabaseAnon
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    return plans || [];
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
}

function formatValidity(days: number): string {
  if (days >= 9999) return "Lifetime access";
  if (days === 365) return "Valid for 1 year";
  if (days === 730) return "Valid for 2 years";
  if (days < 365) return `Valid for ${days} days`;
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `Valid for ${years} ${years === 1 ? 'year' : 'years'}`;
  return `Valid for ${days} days`;
}

function getPlanIcon(planId: string) {
  const icons: Record<string, any> = {
    'free': Sparkles,
    'plus': Zap,
    'pro': Crown,
    'gpat_last_minute': Target,
    'gpat_2027_full': Rocket,
  };
  return icons[planId] || Star;
}

function getPlanGradient(planId: string) {
  const gradients: Record<string, string> = {
    'free': 'from-teal-500 to-teal-600',
    'plus': 'from-teal-500 to-cyan-500',
    'pro': 'from-amber-500 to-orange-500',
    'gpat_last_minute': 'from-blue-500 to-indigo-500',
    'gpat_2027_full': 'from-purple-500 to-pink-500',
  };
  return gradients[planId] || 'from-slate-500 to-slate-600';
}

function getPlanBgGradient(planId: string) {
  const bgGradients: Record<string, string> = {
    'free': 'from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30',
    'plus': 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
    'pro': 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    'gpat_last_minute': 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    'gpat_2027_full': 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  };
  return bgGradients[planId] || 'from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/30';
}

function getFeaturesList(features: any): string[] {
  if (!features) return [];
  
  // If features is already an array
  if (Array.isArray(features)) return features;
  
  // If features is an object with specific properties
  const featureList: string[] = [];
  
  if (features.ai_notes_limit) {
    featureList.push(features.ai_notes_limit === 999 ? 'Unlimited AI Notes' : `${features.ai_notes_limit} AI Notes`);
  }
  if (features.practice_tests_limit) {
    featureList.push(features.practice_tests_limit === 999 ? 'Unlimited Practice Tests' : `${features.practice_tests_limit} Practice Tests`);
  }
  if (features.explanations) {
    featureList.push(`${features.explanations === 'full' ? 'Full' : 'Partial'} Explanations`);
  }
  if (features.analytics) {
    featureList.push(`${features.analytics === 'advanced' ? 'Advanced' : 'Basic'} Analytics`);
  }
  if (features.best_for) {
    featureList.push(`Best for: ${features.best_for}`);
  }
  
  return featureList;
}

export default async function PricingPage() {
  const allPlans = await getPlans();
  
  // Separate plans by category
  const examPacks = allPlans.filter(p => p.plan_category === 'exam_pack');
  const subscriptionPlans = allPlans.filter(p => p.plan_category === 'subscription');
  const heroPlan = allPlans.find(p => p.display_order === 1);

  return (
    <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 bg-clip-text text-transparent">
              Learning Plan
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300 mb-6">
            Select the plan that fits your preparation needs for pharmacy competitive exams.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Start instantly</span>
            </div>
          </div>
        </div>

        {/* Exam Pack Plans (New) */}
        {examPacks.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              🎯 Exam-Focused Preparation Packs
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
              Complete preparation packages for GPAT aspirants
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {examPacks.map((plan) => {
                const IconComponent = getPlanIcon(plan.id);
                const isHero = plan.id === heroPlan?.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      isHero
                        ? `border-purple-400 dark:border-purple-600 bg-gradient-to-br ${getPlanBgGradient(plan.id)} shadow-xl shadow-purple-200/50 dark:shadow-purple-900/50 ring-4 ring-purple-200 dark:ring-purple-800`
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-lg"
                    }`}
                  >
                    {isHero && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
                        <Star className="h-3.5 w-3.5" />
                        Recommended
                      </div>
                    )}

                    <div className="mb-6">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${getPlanGradient(plan.id)} mb-4`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-3">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white">₹{plan.price}</span>
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded mb-2">
                        ✓ {formatValidity(plan.validity_days)}
                      </div>
                    </div>

                    <ul className="mb-6 flex-1 space-y-3">
                      {getFeaturesList(plan.features).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <PricingCTA
                      plan={plan.id === 'free' ? 'free' : 'pro'}
                      text={`Get ${plan.name}`}
                      variant={isHero ? "default" : "outline"}
                      className={`group flex items-center justify-center gap-2 rounded-xl py-4 text-center text-sm font-bold transition-all ${
                        isHero
                          ? `bg-gradient-to-r ${getPlanGradient(plan.id)} text-white shadow-lg hover:shadow-xl hover:scale-105`
                          : "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscription Plans (Original) */}
        {subscriptionPlans.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              📚 Monthly Subscription Plans
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
              Flexible monthly options for continuous learning
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-7xl mx-auto">
              {subscriptionPlans.map((plan) => {
                const IconComponent = getPlanIcon(plan.id);
                const isHighlighted = plan.id === 'pro';
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      isHighlighted
                        ? "border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-xl"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-lg"
                    }`}
                  >
                    <div className="mb-6">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${getPlanGradient(plan.id)} mb-4`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-3">{plan.description || 'Flexible learning plan'}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white">₹{plan.price}</span>
                        {plan.price > 0 && <span className="ml-1 text-sm text-slate-600 dark:text-slate-300">/month</span>}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded mb-2">
                        ✓ {formatValidity(plan.validity_days)}
                      </div>
                    </div>

                    <ul className="mb-6 flex-1 space-y-3">
                      {getFeaturesList(plan.features).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <PricingCTA
                      plan={plan.id as 'free' | 'plus' | 'pro'}
                      text={plan.id === 'free' ? 'Get Started' : `Get ${plan.name}`}
                      variant={isHighlighted ? "default" : "outline"}
                      className={`group flex items-center justify-center gap-2 rounded-xl py-4 text-center text-sm font-bold transition-all ${
                        isHighlighted
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105"
                          : "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust & Security Section */}
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-8 shadow-lg mb-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Start Learning Today - Cancel Anytime
            </h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              No lock-in contracts. <span className="font-bold text-emerald-600 dark:text-emerald-400">Start instantly</span> and learn at your own pace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
              <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">Instant Access</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Start learning in 2 minutes</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
              <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">No Lock-in</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cancel anytime, keep learning</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">100% Secure</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Your data is safe with us</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <div className="inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to Start Your Preparation?
            </h3>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Join students preparing for pharmacy competitive exams with structured study materials and practice tests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PricingCTA
                plan="free"
                text="Start Free Today"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl hover:scale-105 transition-transform"
              />
              {heroPlan && (
                <Link href="/signup">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white hover:bg-white hover:text-purple-600 transition-all">
                    Get {heroPlan.name}
                  </button>
                </Link>
              )}
            </div>
            <p className="text-white/80 text-sm mt-6">
              ✅ No credit card required • ✅ Start instantly • ✅ Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
