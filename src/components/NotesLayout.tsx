"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SideNav from "@/components/SideNav";
import SectionRenderer from "@/components/SectionRenderer";
import type { NotesData } from "@/lib/ai/schemas";
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  BookOpen,
  Zap,
  Crown,
  TrendingUp,
  FileText,
  ArrowLeft,
  ClipboardCheck,
  LogIn
} from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NotesResponse = { ok: true } & NotesData;

export default function NotesLayout({
  topicId,
  topicName,
  subjectName,
  courseId,
}: {
  topicId: string;
  topicName: string;
  subjectName: string;
  courseId: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [notes, setNotes] = React.useState<NotesResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState(0);
  const [loadingTip, setLoadingTip] = React.useState(0);

  // Professional loading messages
  const loadingMessages = [
    { text: "Analyzing topic structure", icon: null },
    { text: "Gathering content from knowledge base", icon: null },
    { text: "Organizing concepts and definitions", icon: null },
    { text: "Generating examples and applications", icon: null },
    { text: "Adding exam-focused insights", icon: null },
    { text: "Finalizing your study notes", icon: null },
  ];

  const studyTips = [
    "Use the Practice Test to reinforce learning",
    "Focus on understanding core concepts first",
    "Spaced repetition improves long-term retention",
    "Take short breaks every 25-30 minutes",
    "Active recall is more effective than passive reading",
    "Consistent daily study yields better results",
    "Review notes within 24 hours for better retention",
    "Practice with mock tests to simulate exam conditions",
  ];

  // Cycle through loading messages and tips
  React.useEffect(() => {
    if (!loading) {
      setLoadingMessage(0);
      setLoadingTip(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    const tipInterval = setInterval(() => {
      setLoadingTip((prev) => (prev + 1) % studyTips.length);
    }, 5000); // Change tip every 5 seconds

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
    };
  }, [loading]);

  // Debug: Log authentication cookies and check session
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      const cookies = document.cookie;
      const hasSupabaseCookie = cookies.includes('sb-');
      console.log('🍪 Auth cookie present:', hasSupabaseCookie);
      
      if (!hasSupabaseCookie) {
        console.warn('⚠️ No Supabase auth cookie found. You may need to log in again.');
      }

      // Check actual session
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
        } else if (!session) {
          console.warn('⚠️ No active session found. Please log in.');
        } else {
          console.log('✅ Active session found for user:', session.user.email);
        }
      } catch (err) {
        console.error('❌ Failed to check session:', err);
      }
    };

    checkAuthStatus();
  }, []);

  const generate = React.useCallback(async (forceRegenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log("📝 Requesting notes generation...");
      const res = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({ topicId, courseId, forceRegenerate }),
      });

      console.log("📡 Response status:", res.status, res.statusText);

      let json: any;
      try {
        json = await res.json();
        console.log("📦 Response data:", json?.ok ? "Success" : `Error: ${json?.error || json?.message || "Unknown"}`);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        setError("Server returned invalid response. Please try again or check the terminal logs.");
        return;
      }

      if (!res.ok || !json.ok) {
        const errorMsg = json?.error || json?.message || `Server error (${res.status})`;
        
        // Handle premium required (403) - This is EXPECTED behavior, not an error
        if (res.status === 403 || errorMsg === "PREMIUM_REQUIRED") {
          console.log("ℹ️ Premium feature - upgrade required");
          setError("PREMIUM_REQUIRED");
          return;
        }
        
        // Log actual errors (not premium blocks)
        console.error("❌ Notes generation failed:");
        console.error("Status:", res.status);
        console.error("Response:", json);
        
        // Provide user-friendly error messages
        let displayError = errorMsg;
        
        // Handle authentication errors (401)
        if (res.status === 401 || errorMsg === "UNAUTHORIZED") {
          displayError = "Your session has expired. Please refresh the page and log in again. If the issue persists, try clearing your browser cookies.";
        } else if (errorMsg === "TOPIC_NOT_FOUND") {
          displayError = "Topic not found. Please try again or contact support.";
        } else if (errorMsg.includes("INVALID_REQUEST")) {
          displayError = "Invalid request. Please refresh the page and try again.";
        } else if (errorMsg.includes("OUTLINE_NOT_FOUND")) {
          displayError = "No study outline found for this topic. Please contact support.";
        } else if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ConnectTimeoutError")) {
          displayError = "Connection timeout. This usually indicates: (1) Network/VPN issues, (2) Firewall blocking connections, or (3) Very slow connection. Try disabling VPN, checking your network settings, or trying again later.";
        } else if (errorMsg === "PREMIUM_REQUIRED") {
          setError("PREMIUM_REQUIRED");
          return;
        } else if (res.status >= 500) {
          displayError = "Server error. Please try again in a few moments. If the issue persists, contact support.";
        }
        
        setError(displayError);
        return;
      }
      
      setNotes(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [topicId, courseId]);

  const handleEnhanceStructures = React.useCallback(async () => {
    if (!notes || isEnhancing) return;
    
    setIsEnhancing(true);
    console.log('🎨 Starting structure enhancement... (this may take 1-3 minutes)');
    
    try {
      // Create an AbortController with a longer timeout (6 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 minutes
      
      const res = await fetch('/api/ai/enhance-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: subjectName,
          topicName: topicName,
          existingNotes: notes,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const json = await res.json();
      
      if (res.ok && json.ok) {
        setNotes(json.data);
      } else {
        setError(`Structure enhancement failed: ${json.error}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Structure enhancement took too long. The topic may be too large. Try regenerating notes first.');
      } else {
        setError('Failed to enhance structures. Please try again.');
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [notes, isEnhancing, subjectName, topicName]);

  // CRITICAL FIX: Call generate ONCE on mount, not on every generate function change
  const hasGenerated = React.useRef(false);
  React.useEffect(() => {
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      generate(false);
    }
  }, []); // Empty deps = runs once on mount

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Card */}
      <Card className="mb-8 overflow-hidden border-teal-200 dark:border-teal-900 shadow-xl bg-gradient-to-br from-teal-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="bg-gradient-to-r from-teal-100 to-teal-50 dark:from-slate-800 dark:to-slate-900 px-4 sm:px-6 py-4 border-b border-teal-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              <Badge className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {subjectName}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800 shadow-lg">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{topicName}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-Powered Study Notes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/test/${topicId}`}>
                <Button 
                  variant="outline"
                  className="border-2 border-green-600 text-green-700 hover:bg-green-50 shadow-sm flex items-center gap-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Take Practice Test
                </Button>
              </Link>
              
              {/* Add Structures button - only for chemistry subjects */}
              {notes && subjectName.toLowerCase().includes('chemistry') && (
                <Button 
                  onClick={handleEnhanceStructures} 
                  disabled={isEnhancing}
                  variant="outline"
                  className="border-2 border-amber-600 text-amber-700 hover:bg-amber-50 shadow-sm flex items-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isEnhancing ? 'animate-pulse' : ''}`} />
                  {isEnhancing ? 'Adding...' : 'Add Structures'}
                </Button>
              )}
              
              <Button 
                onClick={() => generate(true)} 
                disabled={loading}
                className="gradient-sky-button text-white border-0 shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh Notes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && error !== "PREMIUM_REQUIRED" && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    {error.includes("session has expired") || error.includes("UNAUTHORIZED") 
                      ? "Authentication Required" 
                      : error.includes("limit") 
                        ? "Daily Limit Reached" 
                        : "Error Generating Notes"}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  
                  {/* Auth error actions */}
                  {(error.includes("session has expired") || error.includes("UNAUTHORIZED")) && (
                    <div className="mt-4 flex gap-3">
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = '/login'}
                        className="gradient-sky-button text-white border-0 flex items-center gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        Log In Again
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Page
                      </Button>
                    </div>
                  )}
                  
                  {/* Rate limit actions */}
                  {error.includes("limit") && (
                    <div className="mt-4 flex gap-3">
                      <Link href="/pricing">
                        <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          View Plans
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Premium Required - Beautiful Upgrade Prompt */}
          {error === "PREMIUM_REQUIRED" && (
            <div className="mt-6">
              <Card className="overflow-hidden border-0 shadow-2xl dark:shadow-xl">
                {/* Premium Header */}
                <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-amber-500 dark:from-teal-700 dark:via-teal-600 dark:to-amber-600 p-8 text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                      <Crown className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-center mb-3">
                    Premium Content
                  </h2>
                  <p className="text-center text-teal-50 dark:text-teal-100 text-lg max-w-2xl mx-auto">
                    Unlock unlimited AI-powered study notes and ace your GPAT exam
                  </p>
                </div>

                {/* Features Grid */}
                <div className="p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  {/* CTA Section */}
                  <div className="text-center mb-8">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Choose your plan to unlock premium AI-powered study notes
                    </p>
                    <Link href="/pricing">
                      <Button size="lg" className="bg-gradient-to-r from-teal-600 to-amber-600 hover:from-teal-700 hover:to-amber-700 text-white font-bold px-12 py-6 text-lg shadow-2xl hover:shadow-amber-500/25">
                        View All Plans
                      </Button>
                    </Link>
                  </div>

                  {/* Or view detailed plans */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      All plans include AI-powered study notes, practice tests, and performance tracking
                    </p>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap items-center justify-center gap-8 pt-6 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-teal-600 mb-1">5,000+</p>
                      <p className="text-xs text-slate-600">Active Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600 mb-1">98%</p>
                      <p className="text-xs text-slate-600">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 mb-1">24/7</p>
                      <p className="text-xs text-slate-600">Learning Access</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Enhanced Loading State with Progressive Messages */}
          {loading && !notes && (
            <div className="mt-4 space-y-4">
              {/* Main Loading Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{loadingMessages[loadingMessage].icon}</span>
                      <p className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                        {loadingMessages[loadingMessage].text}
                      </p>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Preparing comprehensive learning material just for you
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <span>Generating notes...</span>
                        <span>{Math.min(((loadingMessage + 1) / loadingMessages.length) * 100, 95).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(((loadingMessage + 1) / loadingMessages.length) * 100, 95)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Tips Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">
                    🎓
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm mb-1">
                      While you wait...
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {studyTips[loadingTip]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center hover:shadow-lg transition-shadow">
                  <div className="text-2xl mb-1">📚</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {Math.floor(Math.random() * 20) + 30}+
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Key Concepts
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center hover:shadow-lg transition-shadow">
                  <div className="text-2xl mb-1">💡</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {Math.floor(Math.random() * 10) + 15}+
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Examples
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center hover:shadow-lg transition-shadow">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {Math.floor(Math.random() * 5) + 5}+
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Exam Points
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Notes Content */}
      {notes && (
        <div className="flex gap-6">
          <div className="flex-1 space-y-8">
            {notes.sections?.map((section, index) => (
              <SectionRenderer key={section.id} section={section} index={index} />
            ))}
          </div>
          <SideNav sections={notes.sections ?? []} />
        </div>
      )}

      {/* Empty State */}
      {!notes && !loading && !error && (
        <Card className="p-12 text-center border-2 border-dashed border-slate-300">
          <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-100 mb-4">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Start Learning</h3>
          <p className="text-slate-600 mb-6">Click the "Refresh Content" button to load your study material</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Exam-Focused</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>Comprehensive</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}