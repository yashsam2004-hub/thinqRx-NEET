"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";

/**
 * Old Admin Pricing Page - Redirects to New Plans Management
 * 
 * This page has been replaced by /admin/plans
 * Automatically redirects users to the new interface
 */
export default function AdminPricingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push('/admin/plans');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 text-center border-2 border-teal-200 dark:border-teal-800">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/50 mb-4">
            <Loader2 className="h-8 w-8 text-teal-600 dark:text-teal-400 animate-spin" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Redirecting to New Plans Management
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
            We've upgraded to a modern plans management system with better features and organization.
          </p>
        </div>

        <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-6 mb-6 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="font-bold text-teal-900 dark:text-teal-200 mb-3 flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            What's New
          </h3>
          <ul className="text-left text-sm text-teal-800 dark:text-teal-300 space-y-2">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Manage all 5 plans (Free, Plus, Pro, NEET Crash Course, NEET Full Prep)</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Edit pricing, validity, and display order in one place</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Activate/deactivate plans instantly</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Changes reflect immediately on pricing page</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting you now...</span>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          If you're not redirected automatically, <a href="/admin/plans" className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700">click here</a>
        </p>
      </Card>
    </div>
  );
}
