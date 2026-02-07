"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCourse } from "@/contexts/CourseContext";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { calculateDiscountedPrice } from "@/lib/coupons/utils";

interface PlanPricing {
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

const DEFAULT_FEATURES = {
  free: [
    "Access to free preview topics",
    "3 AI notes generations per day",
    "3 practice tests per day",
    "Max 10 questions per test",
    "Basic study material",
  ],
  plus: [
    "Access to all topics",
    "20 AI notes generations per day",
    "15 practice tests per day",
    "Max 20 questions per test",
    "All study material",
    "Priority support",
  ],
  pro: [
    "Access to all topics",
    "Unlimited AI notes generations",
    "Unlimited practice tests",
    "Max 20 questions per test",
    "All study material",
    "Priority support",
    "Advanced analytics",
    "Mock tests access",
  ],
};

export default function CoursePricingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const { currentCourse, enrollment } = useCourse();

  const [pricing, setPricing] = React.useState<PlanPricing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAnnual, setIsAnnual] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);

  const currentPlan = enrollment?.plan || "free";

  // Load pricing
  React.useEffect(() => {
    const loadPricing = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/admin/pricing?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setPricing(data.pricing || []);
        }
      } catch (error) {
        console.error("Failed to load pricing:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPricing();
  }, [courseId]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          courseId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        toast.error(data.message || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discountPercent: data.discountPercent,
      });
      toast.success(`Coupon applied! ${data.discountPercent}% discount`);
    } catch (error) {
      toast.error("Failed to validate coupon");
    }
  };

  // Handle upgrade
  const handleUpgrade = (plan: string) => {
    setSelectedPlan(plan);
    // Navigate to payment page (will be implemented in Phase 7)
    router.push(`/courses/${courseId}/checkout?plan=${plan}&billing=${isAnnual ? "annual" : "monthly"}${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ""}`);
  };

  // Get price for a plan
  const getPrice = (plan: string): number => {
    const planPricing = pricing.find((p) => p.plan === plan);
    if (!planPricing) return 0;
    return isAnnual ? planPricing.annualPrice : planPricing.monthlyPrice;
  };

  // Calculate final price with coupon
  const getFinalPrice = (plan: string): { original: number; final: number; discount: number } => {
    const originalPrice = getPrice(plan);
    if (!appliedCoupon || originalPrice === 0) {
      return { original: originalPrice, final: originalPrice, discount: 0 };
    }
    const { finalPrice, discount } = calculateDiscountedPrice(originalPrice, appliedCoupon.discountPercent);
    return { original: originalPrice, final: finalPrice, discount };
  };

  // Get features for a plan
  const getFeatures = (plan: string): string[] => {
    const planPricing = pricing.find((p) => p.plan === plan);
    if (planPricing && planPricing.features.length > 0) {
      return planPricing.features;
    }
    return DEFAULT_FEATURES[plan as keyof typeof DEFAULT_FEATURES] || [];
  };

  const plans = ["free", "plus", "pro"];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">
          Choose Your Plan for {currentCourse?.name}
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Upgrade to unlock full access to study materials, AI-generated tests, and mock exams
        </p>
        <div className="mt-4">
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            Current Plan: {currentPlan.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Annual/Monthly Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : ""}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : ""}>
          Annual
        </Label>
        {isAnnual && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Save 20%
          </span>
        )}
      </div>

      {/* Coupon Input */}
      <Card className="mx-auto max-w-md p-6">
        <h3 className="mb-3 font-semibold text-slate-900">Have a coupon code?</h3>
        <div className="flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="uppercase"
          />
          <Button onClick={handleApplyCoupon} variant="outline">
            Apply
          </Button>
        </div>
        {appliedCoupon && (
          <div className="mt-2 flex items-center justify-between rounded bg-emerald-50 px-3 py-2 text-sm">
            <span className="font-medium text-emerald-700">
              {appliedCoupon.code}: {appliedCoupon.discountPercent}% OFF
            </span>
            <button
              onClick={() => {
                setAppliedCoupon(null);
                setCouponCode("");
              }}
              className="text-emerald-600 hover:text-emerald-800"
            >
              Remove
            </button>
          </div>
        )}
      </Card>

      {/* Pricing Cards */}
      {loading ? (
        <div className="text-center text-slate-500">Loading pricing...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const { original, final, discount } = getFinalPrice(plan);
            const features = getFeatures(plan);
            const isCurrentPlan = plan === currentPlan;
            const isDowngrade = 
              (currentPlan === "pro" && (plan === "plus" || plan === "free")) ||
              (currentPlan === "plus" && plan === "free");

            return (
              <Card
                key={plan}
                className={`relative p-6 ${plan === "plus" ? "border-2 border-indigo-500 shadow-lg" : ""}`}
              >
                {plan === "plus" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-xs font-semibold text-white">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold capitalize text-slate-900">{plan}</h3>
                  <div className="mt-4">
                    {original === 0 ? (
                      <div className="text-4xl font-bold text-slate-900">Free</div>
                    ) : (
                      <>
                        {appliedCoupon && discount > 0 && (
                          <div className="text-lg text-slate-500 line-through">₹{original}</div>
                        )}
                        <div className="text-4xl font-bold text-slate-900">₹{final}</div>
                        <div className="text-sm text-slate-600">
                          / {isAnnual ? "year" : "month"}
                        </div>
                        {appliedCoupon && discount > 0 && (
                          <div className="mt-1 text-sm font-semibold text-emerald-600">
                            You save ₹{discount}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade (Contact Support)
                    </Button>
                  ) : plan === "free" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan)}
                      disabled={loading || selectedPlan === plan}
                    >
                      {selectedPlan === plan ? "Processing..." : "Upgrade Now"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAQ or Additional Info */}
      <Card className="p-6">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900">Can I cancel anytime?</h4>
            <p className="mt-1 text-sm text-slate-600">
              Yes, you can cancel your subscription anytime. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900">What happens when I upgrade?</h4>
            <p className="mt-1 text-sm text-slate-600">
              Your upgrade takes effect immediately, and you'll get instant access to all premium features.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Are there any hidden fees?</h4>
            <p className="mt-1 text-sm text-slate-600">
              No, the price you see is the price you pay. No hidden fees or charges.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
