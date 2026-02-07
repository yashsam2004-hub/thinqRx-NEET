"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Sparkles, 
  Zap, 
  Crown, 
  CheckCircle2, 
  FileText,
  GraduationCap,
  Loader2,
  AlertCircle
} from "lucide-react";

interface PricingPlan {
  plan: string;
  monthly_price: number;
  annual_price: number;
}

export default function SignupPage() {
  const router = useRouter();
  
  // Form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [selectedPlan, setSelectedPlan] = React.useState<"free" | "plus" | "pro">("free");
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");
  
  // Data
  const [gpatCourseId, setGpatCourseId] = React.useState<string>("");
  const [pricing, setPricing] = React.useState<Record<string, PricingPlan>>({});
  
  // Loading states
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);

  // Fetch GPAT course and pricing
  React.useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        // Fetch GPAT course (should be the only active one)
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (coursesData) {
          setGpatCourseId(coursesData.id);
          
          // Fetch pricing for GPAT
          const { data: pricingData } = await supabase
            .from("course_pricing")
            .select("*")
            .eq("course_id", coursesData.id);

          if (pricingData) {
            const pricingMap: Record<string, PricingPlan> = {};
            pricingData.forEach((p: any) => {
              pricingMap[p.plan] = {
                plan: p.plan,
                monthly_price: p.monthly_price,
                annual_price: p.annual_price,
              };
            });
            setPricing(pricingMap);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load course information");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const getPrice = () => {
    if (selectedPlan === "free") return 0;
    const planPricing = pricing[selectedPlan];
    if (!planPricing) return 0;
    return billingCycle === "annual" ? planPricing.annual_price : planPricing.monthly_price;
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "pro": return <Crown className="h-5 w-5" />;
      case "plus": return <Zap className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!gpatCourseId) {
      toast.error("Course not available. Please try again later.");
      return;
    }

    setLoading(true);
    try {
      // Use server-side API for reliable signup
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          courseId: gpatCourseId,
          plan: selectedPlan,
          billingCycle: billingCycle,
        }),
      });

      console.log("Signup response status:", signupResponse.status, signupResponse.statusText);

      let signupData;
      try {
        signupData = await signupResponse.json();
        console.log("Signup response data:", signupData);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error("Server error. Please try again.");
        return;
      }

      if (!signupResponse.ok || !signupData.ok) {
        console.error("Signup error:", signupData);
        
        if (signupData.message && signupData.message.includes("already")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(signupData.message || "Failed to create account. Please try again.");
        }
        return;
      }

      // Check if payment is required (paid plans)
      if (signupData.requiresPayment) {
        toast.info(
          `Account created! Please complete payment to activate your ${selectedPlan.toUpperCase()} plan.`,
          { duration: 5000 }
        );
        
        // TODO: Redirect to Razorpay payment page when integrated
        // For now, redirect to login with message to upgrade from dashboard
        setTimeout(() => {
          router.push(
            `/login?message=Account created! Please login and complete payment from your dashboard to activate your ${selectedPlan.toUpperCase()} plan.`
          );
        }, 2000);
        return;
      }

      // FREE plan success - enrollment created
      toast.success("Account created successfully! You can now sign in.");
      
      router.push("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-1px)] max-w-6xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading course information...</p>
        </Card>
      </div>
    );
  }

  const totalPrice = getPrice();
  const annualSavings = selectedPlan !== "free" && pricing[selectedPlan]
    ? Math.round(((pricing[selectedPlan].monthly_price * 12) - pricing[selectedPlan].annual_price) / (pricing[selectedPlan].monthly_price * 12) * 100)
    : 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 py-16 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Your ThinqRx Account</h1>
          <p className="text-lg text-slate-600">Choose your plan and start preparing for GPAT</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <Card className="lg:col-span-2 p-8 border-2 border-slate-200">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Personal Information
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password (min 6 characters)"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-slate-500">Minimum 6 characters required</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
                
                {/* Payment Info Alert */}
                {(selectedPlan === "plus" || selectedPlan === "pro") && (
                  <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900 mb-1">Payment Required</p>
                        <p className="text-amber-800">
                          You'll need to complete payment to activate your {selectedPlan.toUpperCase()} plan. 
                          After account creation, you'll be prompted to complete payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <RadioGroup value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)} className="space-y-3">
                  {/* Free Plan */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === "free" ? "border-teal-500 bg-teal-50 shadow-md" : "border-slate-200 hover:border-teal-300"}`}>
                    <RadioGroupItem value="free" id="free" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-slate-600" />
                        <span className="font-bold text-slate-900">Free</span>
                        <Badge className="bg-slate-100 text-slate-700">₹0</Badge>
                      </div>
                      <p className="text-sm text-slate-600">Basic access to get started</p>
                    </div>
                  </label>

                  {/* Plus Plan */}
                  {pricing.plus && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === "plus" ? "border-teal-500 bg-teal-50 shadow-md" : "border-slate-200 hover:border-teal-300"}`}>
                      <RadioGroupItem value="plus" id="plus" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-teal-600" />
                          <span className="font-bold text-slate-900">Plus</span>
                          <Badge className="bg-teal-100 text-teal-700">
                            ₹{billingCycle === "annual" ? pricing.plus.annual_price : pricing.plus.monthly_price}
                            <span className="text-xs ml-1">/{billingCycle === "annual" ? "year" : "month"}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Payment Required</Badge>
                        </div>
                        <p className="text-sm text-slate-600">More features and practice tests</p>
                      </div>
                    </label>
                  )}

                  {/* Pro Plan */}
                  {pricing.pro && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === "pro" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <RadioGroupItem value="pro" id="pro" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-slate-900">Pro</span>
                          <Badge className="bg-amber-100 text-amber-700">
                            ₹{billingCycle === "annual" ? pricing.pro.annual_price : pricing.pro.monthly_price}
                            <span className="text-xs ml-1">/{billingCycle === "annual" ? "year" : "month"}</span>
                          </Badge>
                          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs">Most Popular</Badge>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Payment Required</Badge>
                        </div>
                        <p className="text-sm text-slate-600">Unlimited access to everything</p>
                      </div>
                    </label>
                  )}
                </RadioGroup>
              </div>

              {/* Billing Cycle */}
              {selectedPlan !== "free" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Billing Cycle</h2>
                  
                  <RadioGroup value={billingCycle} onValueChange={(value: any) => setBillingCycle(value)} className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${billingCycle === "monthly" ? "border-teal-500 bg-teal-50 shadow-md" : "border-slate-200 hover:border-teal-300"}`}>
                      <RadioGroupItem value="monthly" id="monthly" />
                      <div>
                        <div className="font-bold text-slate-900">Monthly</div>
                        <div className="text-sm text-slate-600">Pay monthly</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${billingCycle === "annual" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <RadioGroupItem value="annual" id="annual" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900">Annual</div>
                          <Badge className="bg-green-600 text-white text-xs">Save {annualSavings}%</Badge>
                        </div>
                        <div className="text-sm text-slate-600">Pay yearly</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-6 text-lg font-bold shadow-xl border-0" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    {getPlanIcon(selectedPlan)}
                    <span className="ml-2">Create Account & Enroll</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link className="text-teal-600 font-semibold hover:underline" href="/login">
                Sign in
              </Link>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6 border-2 border-slate-200 h-fit sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Registration Summary</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Exam</p>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-teal-600" />
                  <p className="font-semibold text-slate-900">GPAT</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">Access to all GPAT preparation content</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Plan</p>
                <div className="flex items-center gap-2">
                  {getPlanIcon(selectedPlan)}
                  <p className="font-semibold text-slate-900 capitalize">{selectedPlan}</p>
                </div>
              </div>

              {selectedPlan !== "free" && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Billing</p>
                  <p className="font-semibold text-slate-900 capitalize">{billingCycle}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-600">Subtotal</p>
                  <p className="font-semibold">₹{totalPrice}</p>
                </div>
                
                {selectedPlan !== "free" && billingCycle === "annual" && (
                  <div className="flex items-center justify-between text-sm text-green-600 mb-2">
                    <p>Annual Discount</p>
                    <p>-{annualSavings}%</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-lg font-bold text-slate-900 mt-4">
                  <p>Total</p>
                  <p>₹{totalPrice}</p>
                </div>
              </div>

              {selectedPlan !== "free" && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>Invoice will be sent to your email after registration</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


