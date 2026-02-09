import Link from "next/link";
import { 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  Zap, 
  Rocket,
  Shield,
  Users,
  Brain,
  Target,
  BarChart3,
  Clock,
  HeadphonesIcon,
  Star,
  Award,
  TrendingUp,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Flame,
  ThumbsUp,
  TrendingDown,
  X
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/Navigation";

// Revalidate pricing data every 60 seconds (or on-demand)
export const revalidate = 60;

interface PricingData {
  free: { monthlyPrice: number; annualPrice: number; validityDays: number | null; features: string[]; limitations: string[] };
  plus: { monthlyPrice: number; annualPrice: number; validityDays: number | null; features: string[]; limitations: string[] };
  pro: { monthlyPrice: number; annualPrice: number; validityDays: number | null; features: string[]; limitations: string[] };
}

interface PricingRow {
  plan: string;
  monthly_price: number;
  annual_price: number;
  validity_days: number | null;
  features: string[];
  limitations: string[];
}

async function getPricingData(): Promise<PricingData> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch GPAT course pricing
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("code", "gpat")
      .single();

    if (!course) {
      return getDefaultPricing();
    }

    const { data: pricing } = await supabase
      .from("course_pricing")
      .select("*")
      .eq("course_id", course.id);

    if (!pricing || pricing.length === 0) {
      return getDefaultPricing();
    }

    // Transform pricing data
    const pricingMap: PricingData = {
      free: { monthlyPrice: 0, annualPrice: 0, validityDays: null, features: [], limitations: [] },
      plus: { monthlyPrice: 0, annualPrice: 0, validityDays: 365, features: [], limitations: [] },
      pro: { monthlyPrice: 0, annualPrice: 0, validityDays: 365, features: [], limitations: [] },
    };

    pricing.forEach((p: PricingRow) => {
      const planKey = p.plan.toLowerCase();
      if (planKey === "free" || planKey === "plus" || planKey === "pro") {
        pricingMap[planKey as keyof PricingData] = {
          monthlyPrice: p.monthly_price || 0,
          annualPrice: p.annual_price || 0,
          validityDays: p.validity_days,
          features: p.features || [],
          limitations: p.limitations || [],
        };
      }
    });

    return pricingMap;
  } catch (error) {
    return getDefaultPricing();
  }
}

function getDefaultPricing(): PricingData {
  return {
    free: { monthlyPrice: 0, annualPrice: 0, validityDays: null, features: [], limitations: ['No mock tests', 'No analytics', 'Limited AI notes (5/day)'] },
    plus: { monthlyPrice: 199, annualPrice: 2388, validityDays: 365, features: [], limitations: ['No GPAT mock tests', 'No performance analytics'] },
    pro: { monthlyPrice: 499, annualPrice: 5090, validityDays: 365, features: [], limitations: [] },
  };
}

function formatValidity(days: number | null): string {
  if (days === null) return "Lifetime access";
  if (days === 365) return "Valid for 1 year";
  if (days === 730) return "Valid for 2 years";
  if (days < 365) return `Valid for ${days} days`;
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `Valid for ${years} ${years === 1 ? 'year' : 'years'}`;
  return `Valid for ${days} days (${years}.${Math.round(remainingDays / 36.5)} years)`;
}

export default async function PricingPage() {
  const pricingData = await getPricingData();
  
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "",
      originalPrice: null,
      description: "Test the waters, risk-free",
      icon: Sparkles,
      gradient: "from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700",
      bgGradient: "from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30",
      badge: null,
      popularityBadge: "3,245 students started here",
      features: pricingData.free.features.length > 0 
        ? pricingData.free.features 
        : [
            "Access to free content only",
            "Limited practice tests (3/day)",
          ],
      note: formatValidity(pricingData.free.validityDays),
      limitations: pricingData.free.limitations.length > 0 
        ? pricingData.free.limitations 
        : [
            "No mock tests",
            "No analytics",
            "Limited AI notes (5/day)",
          ],
      cta: "Start Free Today",
      href: "/signup",
      highlighted: false,
      billingOptions: null,
      valueStatement: "Perfect for trying before buying",
    },
    {
      name: "Plus",
      price: `₹${pricingData.plus.monthlyPrice}`,
      period: pricingData.plus.monthlyPrice > 0 ? "/month" : "",
      originalPrice: pricingData.plus.monthlyPrice > 0 ? `₹${Math.round(pricingData.plus.monthlyPrice * 1.5)}` : null,
      description: "Serious preparation, smart price",
      icon: Zap,
      gradient: "from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
      badge: "Best Value",
      popularityBadge: "2,156 students chose this",
      features: pricingData.plus.features.length > 0 
        ? pricingData.plus.features 
        : [
            "Everything in Free, PLUS:",
            "Unlimited AI-powered notes",
            "Unlimited practice tests",
            "Full syllabus coverage (170+ topics)",
          ],
      note: formatValidity(pricingData.plus.validityDays),
      limitations: pricingData.plus.limitations.length > 0 
        ? pricingData.plus.limitations 
        : [
            "No GPAT mock tests",
            "No performance analytics",
          ],
      cta: "Get Plus Now",
      href: "/signup?plan=plus",
      highlighted: false,
      billingOptions: pricingData.plus.annualPrice > 0 ? {
        monthly: { price: `₹${pricingData.plus.monthlyPrice}`, label: "per month" },
        annual: { price: `₹${pricingData.plus.annualPrice}`, label: "per year", savings: `Save ₹${pricingData.plus.monthlyPrice * 12 - pricingData.plus.annualPrice}` },
      } : null,
      note: "Valid for 365 days from purchase",
      valueStatement: pricingData.plus.annualPrice > 0 ? `Save ₹${pricingData.plus.monthlyPrice * 12 - pricingData.plus.annualPrice} vs monthly` : `Only ₹${pricingData.plus.monthlyPrice}/month`,
      savingsAmount: pricingData.plus.annualPrice > 0 ? `₹${pricingData.plus.monthlyPrice * 12 - pricingData.plus.annualPrice}` : null,
    },
    {
      name: "Pro",
      price: `₹${pricingData.pro.monthlyPrice}`,
      period: pricingData.pro.monthlyPrice > 0 ? "/month" : "",
      originalPrice: pricingData.pro.monthlyPrice > 0 ? `₹${Math.round(pricingData.pro.monthlyPrice * 1.6)}` : null,
      yearlyPrice: pricingData.pro.annualPrice > 0 ? `₹${pricingData.pro.annualPrice}` : null,
      description: "Maximize your chances of success",
      icon: Crown,
      gradient: "from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      badge: "95% Pass Rate ⚡",
      popularityBadge: "4,599 toppers used this",
      features: pricingData.pro.features.length > 0 
        ? pricingData.pro.features 
        : [
            "Everything in Plus, plus:",
            "15+ Full GPAT mock tests (125 MCQs)",
            "AI-powered performance analytics",
            "Personalized weak area identification",
            "Adaptive study plans",
            "Rank prediction algorithm",
          ],
      note: formatValidity(pricingData.pro.validityDays),
      limitations: pricingData.pro.limitations,
      cta: "Start Winning Now",
      href: "/signup?plan=pro",
      highlighted: true,
      billingOptions: pricingData.pro.annualPrice > 0 ? {
        monthly: { price: `₹${pricingData.pro.monthlyPrice}`, label: "per month" },
        annual: { price: `₹${pricingData.pro.annualPrice}`, label: "per year", savings: `Save ₹${pricingData.pro.monthlyPrice * 12 - pricingData.pro.annualPrice}` },
      } : null,
      valueStatement: pricingData.pro.annualPrice > 0 ? `Worth ₹${pricingData.pro.monthlyPrice * 12 * 2}+ • Valid for 1 full year` : `Only ₹${pricingData.pro.monthlyPrice}/month`,
      savingsAmount: pricingData.pro.annualPrice > 0 ? `₹${pricingData.pro.monthlyPrice * 12 - pricingData.pro.annualPrice}` : null,
      mostPopular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  plan.highlighted
                    ? `border-purple-400 bg-gradient-to-br ${plan.bgGradient} shadow-xl shadow-purple-200/50 ring-4 ring-purple-200`
                    : "border-slate-200 bg-white shadow-lg"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
                    <Star className="h-3.5 w-3.5" />
                    {plan.badge}
                  </div>
                )}

                {/* Savings Badge */}
                {plan.savingsAmount && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                    Save {plan.savingsAmount}!
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-600 font-medium mb-3">{plan.description}</p>
                  
                  {/* Social Proof */}
                  {plan.popularityBadge && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{plan.popularityBadge}</span>
                    </div>
                  )}
                </div>

                {/* Pricing with Anchoring */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    {plan.originalPrice && (
                      <span className="text-2xl font-bold text-slate-400 line-through">{plan.originalPrice}</span>
                    )}
                    <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="ml-1 text-sm text-slate-600">{plan.period}</span>}
                  </div>
                  
                  {plan.billingOptions && (
                    <div className="text-sm text-slate-600 mb-2">
                      or <span className="font-bold text-slate-900">{plan.billingOptions.annual.price}/year</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {plan.billingOptions.annual.savings}
                      </span>
                    </div>
                  )}
                  
                  {plan.note && (
                    <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded mb-2">
                      ✓ {plan.note}
                    </div>
                  )}

                  {/* Value Statement */}
                  {plan.valueStatement && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      💎 {plan.valueStatement}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-4 flex-1 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations (Loss Aversion) */}
                {plan.limitations && plan.limitations.length > 0 && (
                  <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-600 mb-2">⚠️ What you'll miss:</p>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="h-3.5 w-3.5 flex-shrink-0 text-red-500 mt-0.5" />
                          <span className="text-xs text-red-700">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <a
                  href={plan.href}
                  className={`group flex items-center justify-center gap-2 rounded-xl py-4 text-center text-sm font-bold transition-all ${
                    plan.highlighted
                      ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105 animate-pulse`
                      : "border-2 border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                  <Rocket className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </a>

                {/* Trust Signal */}
                {plan.highlighted && (
                  <p className="text-center text-xs text-slate-500 mt-3">
                    ✅ Start today, cancel anytime
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust & Security Section */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-lg mb-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Start Learning Today - Cancel Anytime
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              No lock-in contracts. <span className="font-bold text-emerald-600">Start instantly</span> and learn at your own pace. 
              We're confident in our platform's ability to help you succeed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-xl">
              <Clock className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">Instant Access</p>
              <p className="text-xs text-slate-600">Start learning in 2 minutes</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl">
              <Award className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">No Lock-in</p>
              <p className="text-xs text-slate-600">Cancel anytime, keep learning</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">100% Secure</p>
              <p className="text-xs text-slate-600">Your data is safe with us</p>
            </div>
          </div>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 rounded-xl bg-white border-2 border-slate-200 shadow-lg">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">10,000+</div>
            <p className="text-sm text-slate-600 font-medium">Active Students</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white border-2 border-slate-200 shadow-lg">
            <div className="text-4xl font-extrabold text-emerald-600 mb-2">95%</div>
            <p className="text-sm text-slate-600 font-medium">Pass Rate (Pro)</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white border-2 border-slate-200 shadow-lg">
            <div className="text-4xl font-extrabold text-purple-600 mb-2">4.9/5</div>
            <p className="text-sm text-slate-600 font-medium">Student Rating</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white border-2 border-slate-200 shadow-lg">
            <div className="text-4xl font-extrabold text-orange-600 mb-2">170+</div>
            <p className="text-sm text-slate-600 font-medium">Topics Covered</p>
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
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl hover:scale-105 transition-transform"
              >
                <Rocket className="h-5 w-5" />
                Start Free Today
              </Link>
              <Link
                href="/signup?plan=pro"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white hover:bg-white hover:text-purple-600 transition-all"
              >
                <Crown className="h-5 w-5" />
                Go Pro Now
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-6">
              ✅ No credit card required • ✅ Start instantly • ✅ Cancel anytime
            </p>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">Have questions?</p>
          <Link href="#" className="text-sky-600 hover:text-sky-700 font-semibold underline">
            View our FAQ →
          </Link>
        </div>
      </div>
    </div>
  );
}
