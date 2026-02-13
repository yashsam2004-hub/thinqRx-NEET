"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRazorpay } from "@/lib/razorpay/useRazorpay";
import {
  Crown,
  Zap,
  CheckCircle2,
  X,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Shield,
  Star
} from "lucide-react";

interface PricingPlan {
  plan: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
  limitations: string[];
  validity_days: number | null;
}

interface DbPlan {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  features: any;
  is_active: boolean;
}

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: razorpayLoading, initiatePayment } = useRazorpay();
  const [user, setUser] = React.useState<any>(null);
  const [currentPlan, setCurrentPlan] = React.useState<string>("free");
  const [loading, setLoading] = React.useState(true);
  const [selectedPlan, setSelectedPlan] = React.useState<"plus" | "pro">("pro");
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");
  const [pricing, setPricing] = React.useState<Record<string, PricingPlan>>({});

  // Pre-select plan from URL query parameter
  React.useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam === "plus" || planParam === "pro") {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  // Fetch user and pricing data with timeout and error handling
  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Add 10-second timeout to prevent infinite loading
        const dataPromise = (async () => {
          // Get current user
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            toast.error("Please login to upgrade your plan");
            router.push("/login");
            return;
          }

          setUser(user);

          // Get current enrollment
          const { data: courses } = await supabase
            .from("courses")
            .select("id")
            .eq("is_active", true)
            .single();

          if (courses) {
            const { data: enrollment } = await supabase
              .from("course_enrollments")
              .select("plan")
              .eq("user_id", user.id)
              .eq("course_id", courses.id)
              .maybeSingle();

            if (enrollment) {
              setCurrentPlan(enrollment.plan);
            }

            // SINGLE SOURCE OF TRUTH: Fetch pricing from `plans` table
            const { data: plansData } = await supabase
              .from("plans")
              .select("*")
              .in("id", ["plus", "pro"])
              .eq("is_active", true);

            if (plansData && plansData.length > 0) {
              const pricingMap: Record<string, PricingPlan> = {};
              plansData.forEach((p: DbPlan) => {
                const featuresList = Array.isArray(p.features) 
                  ? p.features 
                  : p.features?.best_for 
                    ? [p.features.best_for] 
                    : [];
                pricingMap[p.id] = {
                  plan: p.id,
                  monthly_price: p.price,
                  annual_price: Math.round(p.price * 12 * 0.8), // 20% annual discount
                  features: featuresList,
                  limitations: [],
                  validity_days: p.validity_days,
                };
              });
              setPricing(pricingMap);
            } else {
              console.error("[Upgrade] No plans found in DB, using fallback");
              setPricing({
                plus: {
                  plan: "plus",
                  monthly_price: 199,
                  annual_price: Math.round(199 * 12 * 0.8),
                  features: ["AI-Powered Study Notes", "Practice Tests", "Performance Analytics"],
                  limitations: [],
                  validity_days: 365,
                },
                pro: {
                  plan: "pro",
                  monthly_price: 299,
                  annual_price: Math.round(299 * 12 * 0.8),
                  features: ["Everything in Plus", "Unlimited AI Notes", "Unlimited Practice Tests", "Priority Support"],
                  limitations: [],
                  validity_days: 365,
                },
              });
            }
          }
        })();

        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("Loading timeout after 10 seconds")), 10000)
        );

        await Promise.race([dataPromise, timeoutPromise]);
      } catch (error) {
        console.error("Error loading data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load pricing information";
        toast.error(errorMessage);
        
        // Set fallback pricing even on error (must match DB plans table)
        setPricing({
          plus: {
            plan: "plus",
            monthly_price: 199,
            annual_price: Math.round(199 * 12 * 0.8),
            features: ["AI-Powered Study Notes", "Practice Tests", "Performance Analytics"],
            limitations: [],
            validity_days: 30,
          },
          pro: {
            plan: "pro",
            monthly_price: 299,
            annual_price: Math.round(299 * 12 * 0.8),
            features: ["Everything in Plus", "Unlimited AI Notes", "Unlimited Practice Tests", "Priority Support"],
            limitations: [],
            validity_days: 30,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const getPrice = () => {
    const planPricing = pricing[selectedPlan];
    if (!planPricing) return 0;
    return billingCycle === "annual"
      ? planPricing.annual_price
      : planPricing.monthly_price;
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }

    // Check if user is trying to "upgrade" to their current plan or downgrade
    if (currentPlan === selectedPlan) {
      toast.info("You already have this plan!");
      return;
    }

    if (currentPlan === "pro") {
      toast.info("You already have the Pro plan (highest tier)");
      return;
    }

    if (currentPlan === "plus" && selectedPlan === "plus") {
      toast.info("You already have the Plus plan");
      return;
    }

    try {
      // Initiate Razorpay payment
      await initiatePayment({
        planId: selectedPlan.toUpperCase() as 'PLUS' | 'PRO',
        billingCycle: billingCycle.toUpperCase() as 'MONTHLY' | 'ANNUAL',
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0],
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  const annualSavings = pricing[selectedPlan]
    ? Math.round(
        ((pricing[selectedPlan].monthly_price * 12 -
          pricing[selectedPlan].annual_price) /
          (pricing[selectedPlan].monthly_price * 12)) *
          100
      )
    : 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-6 gap-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Upgrade Your Plan
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
              Unlock premium features and supercharge your GPAT preparation
            </p>
            {currentPlan !== "free" && (
              <Badge className="bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-0">
                Current Plan: {currentPlan.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Selection */}
          <Card className="lg:col-span-2 p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800/50">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Choose Your Plan
            </h2>

            {/* Secure Payment Notice */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                    Secure Payment Powered by Razorpay
                  </p>
                  <p className="text-green-800 dark:text-green-400">
                    Your payment is processed securely through Razorpay, India's leading payment gateway. All transactions are encrypted and PCI DSS compliant.
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Cards */}
            <RadioGroup
              value={selectedPlan}
              onValueChange={(value: any) => setSelectedPlan(value)}
              className="space-y-4 mb-6"
            >
              {/* Plus Plan */}
              {pricing.plus && (
                <label
                  className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === "plus"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600"
                  }`}
                >
                  <RadioGroupItem value="plus" id="plus" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      <span className="font-bold text-xl text-slate-900 dark:text-white">
                        Plus
                      </span>
                      <Badge className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                        ₹
                        {billingCycle === "annual"
                          ? pricing.plus.annual_price
                          : pricing.plus.monthly_price}
                        <span className="text-xs ml-1">
                          /{billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </Badge>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-3">
                      {pricing.plus.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limitations */}
                    {pricing.plus.limitations.length > 0 && (
                      <div className="space-y-1">
                        {pricing.plus.limitations.map((limitation, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <X className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-500 dark:text-slate-400">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              )}

              {/* Pro Plan */}
              {pricing.pro && (
                <label
                  className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all relative ${
                    selectedPlan === "pro"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600"
                  }`}
                >
                  <RadioGroupItem value="pro" id="pro" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold text-xl text-slate-900 dark:text-white">
                        Pro
                      </span>
                      <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                        ₹
                        {billingCycle === "annual"
                          ? pricing.pro.annual_price
                          : pricing.pro.monthly_price}
                        <span className="text-xs ml-1">
                          /{billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </Badge>
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-3">
                      {pricing.pro.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Recommended Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    Recommended
                  </div>
                </label>
              )}
            </RadioGroup>

            {/* Billing Cycle */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Billing Cycle
              </h3>

              <RadioGroup
                value={billingCycle}
                onValueChange={(value: any) => setBillingCycle(value)}
                className="grid grid-cols-2 gap-4"
              >
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    billingCycle === "monthly"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600"
                  }`}
                >
                  <RadioGroupItem value="monthly" id="monthly" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Monthly</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Pay monthly</div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    billingCycle === "annual"
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <RadioGroupItem value="annual" id="annual" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900 dark:text-white">Annual</div>
                      <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs">
                        Save {annualSavings}%
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Pay yearly</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handleProceedToPayment}
              disabled={razorpayLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {razorpayLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Secure Payment
                </>
              )}
            </Button>
            
            {/* Powered by Razorpay */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Razorpay</span>
              </p>
            </div>
          </Card>

          {/* Summary Card */}
          <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 h-fit">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Payment Summary
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Plan</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPlan.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Billing</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {billingCycle === "annual" ? "Yearly" : "Monthly"}
                </span>
              </div>

              {billingCycle === "annual" && pricing[selectedPlan] && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span>Savings</span>
                  <span className="font-semibold">
                    ₹
                    {pricing[selectedPlan].monthly_price * 12 -
                      pricing[selectedPlan].annual_price}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    ₹{getPrice()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
                  {billingCycle === "annual"
                    ? "Billed annually"
                    : "Billed monthly"}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="space-y-3 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Valid for 365 days (1 year)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Instant access after payment</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Need Help */}
        <Card className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Need help choosing a plan?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Contact our support team or view detailed plan comparison
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  Compare Plans
                </Button>
              </Link>
              <a href="mailto:support@thinqrx.com">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
