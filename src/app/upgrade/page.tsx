"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRazorpay } from "@/lib/razorpay/useRazorpay";
import {
  Crown,
  Zap,
  CheckCircle2,
  Loader2,
  CreditCard,
  Shield,
  Star,
  Target,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import type { Plan } from "@/lib/plans";
import { getFeaturesList, formatValidity } from "@/lib/plans";

function getPlanIcon(planId: string) {
  switch (planId) {
    case "pro":
      return <Crown className="h-6 w-6" />;
    case "plus":
      return <Zap className="h-6 w-6" />;
    case "gpat_2027_full":
      return <Rocket className="h-6 w-6" />;
    case "gpat_last_minute":
      return <Target className="h-6 w-6" />;
    default:
      return <Star className="h-6 w-6" />;
  }
}

function getPlanBorder(planId: string, selected: boolean) {
  if (!selected) return "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600";
  switch (planId) {
    case "pro":
      return "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg ring-2 ring-amber-200 dark:ring-amber-800";
    case "gpat_2027_full":
      return "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800";
    default:
      return "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-lg ring-2 ring-teal-200 dark:ring-teal-800";
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: razorpayLoading, initiatePayment } = useRazorpay();

  const [user, setUser] = React.useState<any>(null);
  const [currentPlan, setCurrentPlan] = React.useState<string>("free");
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("");

  // Pre-select plan from URL
  React.useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam) {
      setSelectedPlanId(planParam);
    }
  }, [searchParams]);

  // Fetch ALL active plans + user enrollment
  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createSupabaseBrowserClient();

        const dataPromise = (async () => {
          // Get user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast.error("Please login to upgrade your plan");
            router.push("/login");
            return;
          }
          setUser(user);

          // Get current enrollment
          const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("plan, status")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          if (enrollment) {
            setCurrentPlan(enrollment.plan);
          }

          // SINGLE SOURCE OF TRUTH: Fetch ALL active paid plans from plans table
          const { data: allPlans } = await supabase
            .from("plans")
            .select("*")
            .eq("is_active", true)
            .order("display_order");

          if (allPlans && allPlans.length > 0) {
            // Filter out the free plan (can't upgrade TO free) and the user's current plan
            const paidPlans = allPlans.filter((p: Plan) => p.price > 0);
            setPlans(paidPlans);

            // Auto-select the first available plan if none pre-selected
            const planParam = new URLSearchParams(window.location.search).get("plan");
            if (planParam && paidPlans.find((p: Plan) => p.id === planParam)) {
              setSelectedPlanId(planParam);
            } else if (paidPlans.length > 0 && !planParam) {
              // Default: select first exam pack or first plan
              const examPack = paidPlans.find((p: Plan) => p.plan_category === "exam_pack");
              setSelectedPlanId(examPack?.id || paidPlans[0].id);
            }
          }
        })();

        await Promise.race([
          dataPromise,
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
        ]);
      } catch (error) {
        console.error("[Upgrade] Error:", error);
        toast.error("Failed to load plans. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, searchParams]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const getDisplayPrice = () => {
    if (!selectedPlan) return 0;
    return selectedPlan.price;
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    if (currentPlan === selectedPlanId) {
      toast.info("You already have this plan!");
      return;
    }

    try {
      await initiatePayment({
        planId: selectedPlan.id,
        billingCycle: "ONE_TIME",
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email?.split("@")[0],
      });
    } catch (error) {
      console.error("[Upgrade] Payment error:", error);
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

  // Separate plans by category for display
  const examPacks = plans.filter((p) => p.plan_category === "exam_pack");
  const subscriptions = plans.filter((p) => p.plan_category === "subscription");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />
      <div className="mx-auto max-w-5xl py-12 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Upgrade Your Plan
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
              Choose a plan to supercharge your GPAT preparation
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
            {/* Secure Payment Notice */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 dark:text-green-300">Secure Payment by Razorpay</p>
                  <p className="text-green-800 dark:text-green-400">Encrypted &amp; PCI DSS compliant.</p>
                </div>
              </div>
            </div>

            {/* Exam-Focused Packs */}
            {examPacks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Exam-Focused Packs</h2>
                <div className="space-y-3">
                  {examPacks.map((plan) => {
                    const isOwned = currentPlan === plan.id;
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        disabled={isOwned}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full text-left flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          isOwned
                            ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed"
                            : getPlanBorder(plan.id, isSelected)
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg ${isSelected ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                          {getPlanIcon(plan.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</span>
                            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-0">
                              ₹{plan.price}
                            </Badge>
                            {isOwned && (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-0">
                                Current Plan
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{plan.description}</p>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatValidity(plan.validity_days)}
                          </div>
                          {/* Feature preview */}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {getFeaturesList(plan.features).slice(0, 3).map((f, i) => (
                              <span key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subscription Plans */}
            {subscriptions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Subscription Plans</h2>
                <div className="space-y-3">
                  {subscriptions.filter((p) => p.price > 0).map((plan) => {
                    const isOwned = currentPlan === plan.id;
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        disabled={isOwned}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full text-left flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          isOwned
                            ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed"
                            : getPlanBorder(plan.id, isSelected)
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg ${isSelected ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                          {getPlanIcon(plan.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</span>
                            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-0">
                              ₹{plan.price}
                            </Badge>
                            {plan.id === "pro" && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs border-0">
                                <Star className="h-3 w-3 mr-1" /> Popular
                              </Badge>
                            )}
                            {isOwned && (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-0">
                                Current Plan
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {plan.description || `${plan.name} subscription`}
                          </p>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatValidity(plan.validity_days)}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {getFeaturesList(plan.features).slice(0, 3).map((f, i) => (
                              <span key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Payment Button */}
            <Button
              onClick={handleProceedToPayment}
              disabled={razorpayLoading || !selectedPlan}
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

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Razorpay</span>
              </p>
            </div>
          </Card>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 h-fit">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Payment Summary
              </h3>

              {selectedPlan ? (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Plan</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPlan.name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Validity</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatValidity(selectedPlan.validity_days)}</span>
                  </div>

                  <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        ₹{getDisplayPrice()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
                      One-time payment
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Select a plan to see summary</p>
              )}

              {/* Trust Badges */}
              <div className="space-y-3 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Secure payment processing</span>
                </div>
                {selectedPlan && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{formatValidity(selectedPlan.validity_days)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Instant access after payment</span>
                </div>
              </div>
            </Card>

            {/* Help Card */}
            <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Need help?</h3>
                <div className="flex items-center justify-center gap-4">
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">Compare Plans</Button>
                  </Link>
                  <a href="mailto:info@thinqrx.in">
                    <Button variant="outline" size="sm">Contact Support</Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
