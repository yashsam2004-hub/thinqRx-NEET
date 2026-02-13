"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  // Form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Data
  const [gpatCourseId, setGpatCourseId] = React.useState<string>("");

  // Loading states
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);

  // Fetch GPAT course ID
  React.useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createSupabaseBrowserClient();

        const { data: coursesData } = await supabase
          .from("courses")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (coursesData) {
          setGpatCourseId(coursesData.id);
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course information");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

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
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          courseId: gpatCourseId,
          plan: "free",
          billingCycle: "monthly",
        }),
      });

      let signupData;
      try {
        signupData = await signupResponse.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error("Server error. Please try again.");
        return;
      }

      if (!signupResponse.ok || !signupData.ok) {
        if (signupData.message && signupData.message.includes("already")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(signupData.message || "Failed to create account. Please try again.");
        }
        return;
      }

      if (signupData.requiresEmailVerification) {
        toast.success("Account created! Please verify your email to continue.", {
          duration: 10000,
        });
        setTimeout(() => {
          router.push(
            `/login?message=Please verify your email first. Check your inbox for the verification link.&email=${encodeURIComponent(email)}`
          );
        }, 3000);
        return;
      }

      toast.success("Account created successfully! You can now sign in.");
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md p-12 text-center dark:bg-slate-800/50 dark:border-slate-700">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-16 px-6">
      {/* Home Icon */}
      <Link
        href="/"
        className="fixed top-6 left-6 p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-500 transition-all shadow-sm"
        aria-label="Home"
      >
        <Home className="h-5 w-5 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400" />
      </Link>

      <Card className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 p-3 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Start preparing for GPAT with ThinqRx - it's free
          </p>
        </div>

        {/* Free plan info */}
        <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-teal-900 dark:text-teal-300">
                Free Plan Included
              </p>
              <p className="text-teal-800 dark:text-teal-400">
                Get started with basic access. You can upgrade to Plus or Pro anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="dark:text-slate-200">Full Name</Label>
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
            <Label htmlFor="email" className="dark:text-slate-200">Email Address</Label>
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
            <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="dark:text-slate-200">Confirm Password</Label>
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

          <Button
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-6 text-base font-semibold shadow-lg border-0"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Free Account
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
