"use client";

import { redirect } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentCourse, enrollment, isLoading: courseLoading } = useCourse();

  // Show loading state
  if (authLoading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // SECURITY FIX: Removed client-side plan check
  // Plan checking is done server-side in /api/analytics/overview
  // The API will return a 403 error if the user doesn't have Pro plan
  // The AnalyticsDashboard component will handle and display the error appropriately
  
  // Check if course exists
  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 p-6">
        {/* Navigation */}
        <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-200 mb-6">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">No Course Selected</h1>
            <p className="text-slate-600 mb-6">Please select a course to view your analytics.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
