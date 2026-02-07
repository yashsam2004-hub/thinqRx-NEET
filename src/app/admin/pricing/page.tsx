"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Pricing {
  id: string;
  courseId: string;
  courseName: string;
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  validityDays: number | null;
  features: string[];
  limitations: string[];
}

export default function AdminPricingPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [pricing, setPricing] = React.useState<Pricing[]>([]);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [selectedPlan, setSelectedPlan] = React.useState<"free" | "plus" | "pro">("plus");
  const [monthlyPrice, setMonthlyPrice] = React.useState(0);
  const [annualPrice, setAnnualPrice] = React.useState(0);
  const [validityDays, setValidityDays] = React.useState<number | null>(365);
  const [featureInput, setFeatureInput] = React.useState("");
  const [features, setFeatures] = React.useState<string[]>([]);
  const [limitationInput, setLimitationInput] = React.useState("");
  const [limitations, setLimitations] = React.useState<string[]>([]);

  // Load courses
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          if (data.courses?.length > 0) {
            setSelectedCourse(data.courses[0].id);
          }
        }
      } catch (error) {
        toast.error("Failed to load courses");
      }
    };
    loadCourses();
  }, []);

  // Load pricing for selected course
  const loadPricing = React.useCallback(async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pricing?courseId=${selectedCourse}`);
      if (res.ok) {
        const data = await res.json();
        setPricing(data.pricing || []);

        // Load existing pricing for selected plan
        const existingPricing = data.pricing?.find(
          (p: Pricing) => p.plan === selectedPlan && p.courseId === selectedCourse
        );

        if (existingPricing) {
          setMonthlyPrice(existingPricing.monthlyPrice);
          setAnnualPrice(existingPricing.annualPrice);
          setValidityDays(existingPricing.validityDays);
          setFeatures(existingPricing.features || []);
          setLimitations(existingPricing.limitations || []);
        } else {
          // Set default validity based on plan
          setValidityDays(selectedPlan === "free" ? null : 365);
          setLimitations([]);
        }
      }
    } catch (error) {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedPlan]);

  React.useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  // Auto-calculate annual price (20% discount)
  React.useEffect(() => {
    if (monthlyPrice > 0) {
      const annual = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
      setAnnualPrice(annual);
    }
  }, [monthlyPrice]);

  // Add feature
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Add limitation
  const addLimitation = () => {
    if (limitationInput.trim()) {
      setLimitations([...limitations, limitationInput.trim()]);
      setLimitationInput("");
    }
  };

  // Remove limitation
  const removeLimitation = (index: number) => {
    setLimitations(limitations.filter((_, i) => i !== index));
  };

  // Save pricing
  const handleSave = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          plan: selectedPlan,
          monthlyPrice,
          annualPrice,
          validityDays,
          features,
          limitations,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.message || "Failed to save pricing");
        return;
      }

      toast.success("Pricing updated successfully");
      loadPricing();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const selectedCourseName = courses.find((c) => c.id === selectedCourse)?.name || "";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Pricing Management</h1>
        <p className="mt-2 text-slate-600">
          Set monthly and annual pricing for each course and plan
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Pricing Form */}
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="course">Select Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Select Plan</Label>
            <Select
              value={selectedPlan}
              onValueChange={(value) => setSelectedPlan(value as "free" | "plus" | "pro")}
            >
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (₹)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                min="0"
                disabled={selectedPlan === "free"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualPrice">Annual Price (₹)</Label>
              <Input
                id="annualPrice"
                type="number"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(Number(e.target.value))}
                min="0"
                disabled={selectedPlan === "free"}
              />
              {monthlyPrice > 0 && (
                <p className="text-xs text-emerald-600">
                  20% discount: ₹{Math.round(monthlyPrice * 12 * 0.8)} suggested
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validityDays">Validity Period (Days)</Label>
            <Input
              id="validityDays"
              type="number"
              value={validityDays ?? ""}
              onChange={(e) => setValidityDays(e.target.value === "" ? null : Number(e.target.value))}
              min="1"
              placeholder={selectedPlan === "free" ? "Lifetime (leave empty)" : "365"}
            />
            <p className="text-xs text-slate-500">
              {selectedPlan === "free" 
                ? "Leave empty for lifetime access (Free plan)" 
                : `Number of days access is valid. ${validityDays ? `Current: ${validityDays} days (${Math.round(validityDays / 365 * 10) / 10} years)` : "365 days = 1 year"}`
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (What They Get)</Label>
            <div className="flex gap-2">
              <Input
                id="features"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add a feature..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" onClick={addFeature} variant="outline">
                Add
              </Button>
            </div>
            <ul className="mt-2 space-y-1">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded bg-green-50 border border-green-200 px-3 py-2 text-sm"
                >
                  <span className="text-green-800">✓ {feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="h-6 text-red-600"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitations">Limitations (What They'll Miss)</Label>
            <div className="flex gap-2">
              <Input
                id="limitations"
                value={limitationInput}
                onChange={(e) => setLimitationInput(e.target.value)}
                placeholder="Add a limitation..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLimitation();
                  }
                }}
              />
              <Button type="button" onClick={addLimitation} variant="outline">
                Add
              </Button>
            </div>
            <ul className="mt-2 space-y-1">
              {limitations.map((limitation, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded bg-red-50 border border-red-200 px-3 py-2 text-sm"
                >
                  <span className="text-red-800">✗ {limitation}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLimitation(index)}
                    className="h-6 text-red-600"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Optional: Leave empty if there are no limitations (recommended for Pro plan)
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Pricing
          </Button>
        </Card>

        {/* Right: Current Pricing Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">Current Pricing</h3>
          <p className="mt-1 text-sm text-slate-600">{selectedCourseName}</p>
          
          <div className="mt-4 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : pricing.length === 0 ? (
              <p className="text-sm text-slate-500">No pricing set yet</p>
            ) : (
              pricing.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize">{p.plan}</span>
                    <span className="text-sm text-slate-600">
                      ₹{p.monthlyPrice}/mo
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Annual: ₹{p.annualPrice}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {p.features.length} features
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
