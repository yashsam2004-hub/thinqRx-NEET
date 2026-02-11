"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogIn, Loader2, Home } from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      
      // Wait for session to be established
      if (data.session) {
        // Best-effort: if this email is allowlisted, sync profiles.role='admin' server-side.
        await fetch("/api/auth/sync-admin", { method: "POST" }).catch(() => {});
        
        // PERFORMANCE FIX: Removed artificial 300ms delay
        // Session cookies are set synchronously, no delay needed
        
        toast.success("Welcome back!");
        
        // Use window.location for full page reload to ensure clean state
        window.location.href = next;
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-6 py-16">
      {/* Home Icon - Top Left */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-500 transition-all shadow-sm"
        aria-label="Home"
      >
        <Home className="h-5 w-5 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400" />
      </Link>

      <Card className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 p-3 shadow-lg">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            Sign in to your ThinqRx account
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-6 text-base font-semibold shadow-lg" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Don't have an account?{" "}
          <Link className="text-teal-600 dark:text-teal-400 font-semibold hover:underline" href="/signup">
            Create one
          </Link>
        </div>
      </Card>
    </div>
  );
}


