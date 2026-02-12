"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Mail, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Home,
  ArrowLeft
} from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [resending, setResending] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Countdown timer for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
      return;
    }

    setResending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error("Resend error:", error);
        toast.error(error.message || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setCountdown(60); // 60 second cooldown
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Refresh session to get latest email verification status
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        toast.error("Failed to check verification status");
        return;
      }

      if (session?.user?.email_confirmed_at) {
        toast.success("Email verified successfully! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast.info("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (error: any) {
      console.error("Check verification error:", error);
      toast.error("Failed to check verification status");
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 px-6 flex items-center justify-center">
      <div className="mx-auto max-w-2xl w-full">
        <Card className="p-8 md:p-12 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800/50">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 shadow-xl">
              <Mail className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">
            Verify Your Email
          </h1>

          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
              We've sent a verification email to:
            </p>
            <p className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-6">
              {email || "your email address"}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Please check your inbox and click the verification link to activate your account.
            </p>
          </div>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 mb-8">
            <h2 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              What to do next:
            </h2>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Return here and click "I've Verified My Email"</span>
              </li>
            </ol>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-6 text-lg font-semibold border-0"
            >
              {checking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  I've Verified My Email
                </>
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0}
              variant="outline"
              className="w-full py-6 text-base"
            >
              {resending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Resend Email in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
              Didn't receive the email? Check your spam folder or click the resend button above.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Sign Out
              </Button>
              
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
