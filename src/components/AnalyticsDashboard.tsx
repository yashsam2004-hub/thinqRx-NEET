"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  CheckCircle2,
  Loader2,
  Sparkles,
  Brain,
  ArrowLeft,
  Home,
  BookOpen,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [improvementPlan, setImprovementPlan] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [generatingPlan, setGeneratingPlan] = React.useState(false);
  const [isPremiumRequired, setIsPremiumRequired] = React.useState(false);

  // PERFORMANCE FIX: Wrap fetchAnalytics in useCallback to prevent unnecessary re-renders
  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const analyticsRes = await fetch("/api/analytics/overview");
      const analyticsData = await analyticsRes.json();

      if (analyticsData.ok) {
        if (analyticsData.analytics) {
          setAnalytics(analyticsData.analytics);
          setIsPremiumRequired(false); // Reset premium flag
        } else {
          toast.info(analyticsData.message || "No test attempts found");
        }
      } else {
        console.error("[AnalyticsDashboard] Failed to load analytics:", analyticsData);
        // UX FIX: Show upgrade prompt instead of error toast for premium features
        if (analyticsData.error === "PREMIUM_FEATURE") {
          setIsPremiumRequired(true);
          // Don't show toast - we'll show a nice upgrade UI instead
        } else {
          toast.error(analyticsData.message || "Failed to load analytics");
        }
      }
    } catch (error) {
      console.error("[AnalyticsDashboard] Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed - all state setters are stable

  // Load analytics on mount only (auto-refresh removed to prevent performance cascade)
  React.useEffect(() => {
    fetchAnalytics();
    // Users can refresh manually or analytics will update on navigation
  }, [fetchAnalytics]);

  const generateImprovementPlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/analytics/improvement-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.ok && data.plan) {
        setImprovementPlan(data.plan);
        toast.success("Improvement plan generated!");
      } else {
        toast.error(data.message || "Failed to generate plan");
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate improvement plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // UX FIX: Show upgrade prompt if premium is required (server enforced)
  if (isPremiumRequired) {
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

        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 mb-6">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Pro Feature
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              AI-powered analytics is available exclusively for Pro members
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Upgrade Now
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
        <Card className="p-12 text-center max-w-2xl">
          <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            No Data Available
          </h2>
          <p className="text-slate-600 mb-8">
            Take some tests to see your personalized analytics
          </p>
          <Button onClick={() => (window.location.href = "/subjects")}>
            Start Practicing
          </Button>
        </Card>
      </div>
    );
  }

  const { overallStats, topicPerformance, difficultyPerformance, accuracyTrends, mockTestAnalytics } = analytics;
  const weakTopics = topicPerformance.filter((t: any) => t.isWeak);
  const hasMockTests = mockTestAnalytics && mockTestAnalytics.totalMockTests > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-10 px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
            </div>
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              size="sm"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Your Learning Insights
          </Badge>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Your Progress
          </h1>
          <p className="text-lg text-slate-600">
            Understanding where you are and where to focus next
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-slate-500" />
              <Badge className="bg-slate-100 text-slate-700 border-0">
                {overallStats.totalAttempts}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-1">Practice Sessions</p>
            <p className="text-2xl font-bold text-slate-800">
              {Math.floor(overallStats.totalTimeSpent / 3600)}h invested
            </p>
          </Card>

          <Card className="p-6 border border-emerald-200 bg-emerald-50/30 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                {overallStats.avgAccuracy.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-emerald-700 font-medium mb-1">Current Accuracy</p>
            <p className="text-2xl font-bold text-emerald-800">
              {overallStats.avgScore.toFixed(0)} marks avg
            </p>
          </Card>

          <Card className="p-6 border border-blue-200 bg-blue-50/30 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 border-0">
                {weakTopics.length}
              </Badge>
            </div>
            <p className="text-sm text-blue-700 font-medium mb-1">Topics to revisit</p>
            <p className="text-xl font-semibold text-blue-800">
              Ready to improve
            </p>
          </Card>

          <Card className="p-6 border border-teal-200 bg-teal-50/30 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
              <Badge className="bg-teal-100 text-teal-700 border-0">
                {overallStats.strongTopics}
              </Badge>
            </div>
            <p className="text-sm text-teal-700 font-medium mb-1">Going well</p>
            <p className="text-xl font-semibold text-teal-800">
              Keep it up
            </p>
          </Card>
        </div>

        {/* Mock Test Performance */}
        {hasMockTests && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Mock Test Performance
              </h2>
              <p className="text-slate-600">
                Your performance across {mockTestAnalytics.totalMockTests} mock test{mockTestAnalytics.totalMockTests > 1 ? "s" : ""}
              </p>
            </div>

            {/* Mock Test Stats */}
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="p-6 border border-blue-200 bg-blue-50/30 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <Badge className={`border-0 ${
                    mockTestAnalytics.progressTrend === "improving"
                      ? "bg-emerald-100 text-emerald-700"
                      : mockTestAnalytics.progressTrend === "declining"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {mockTestAnalytics.progressTrend === "improving" && <TrendingUp className="h-3 w-3 inline mr-1" />}
                    {mockTestAnalytics.progressTrend === "declining" && <TrendingDown className="h-3 w-3 inline mr-1" />}
                    {mockTestAnalytics.progressTrend.charAt(0).toUpperCase() + mockTestAnalytics.progressTrend.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 font-medium mb-1">Average Accuracy</p>
                <p className="text-2xl font-bold text-blue-800">
                  {mockTestAnalytics.avgAccuracy.toFixed(1)}%
                </p>
              </Card>

              <Card className="p-6 border border-emerald-200 bg-emerald-50/30 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Target className="h-8 w-8 text-emerald-600" />
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {mockTestAnalytics.avgScore.toFixed(0)} / {mockTestAnalytics.bestPerformance?.maxScore || 0}
                  </Badge>
                </div>
                <p className="text-sm text-emerald-700 font-medium mb-1">Average Score</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {mockTestAnalytics.avgScore.toFixed(1)} marks
                </p>
              </Card>

              <Card className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-slate-600" />
                  <Badge className="bg-slate-100 text-slate-700 border-0">
                    {mockTestAnalytics.totalMockTests} tests
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 font-medium mb-1">Total Time</p>
                <p className="text-2xl font-bold text-slate-800">
                  {Math.floor(mockTestAnalytics.totalTimeSpent / 3600)}h {Math.floor((mockTestAnalytics.totalTimeSpent % 3600) / 60)}m
                </p>
              </Card>
            </div>

            {/* Subject-wise Performance */}
            {mockTestAnalytics.subjectWiseAggregated.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject-wise Performance in Mock Tests</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockTestAnalytics.subjectWiseAggregated.map((subject: any) => (
                    <Card key={subject.subject} className={`p-5 border ${subject.isWeak ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">{subject.subject}</h4>
                        <Badge className={`${subject.isWeak ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} border-0`}>
                          {subject.accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Correct:</span>
                          <span className="font-semibold text-emerald-700">{subject.correct}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Incorrect:</span>
                          <span className="font-semibold text-red-700">{subject.incorrect}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Skipped:</span>
                          <span className="font-semibold text-slate-700">{subject.skipped}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                          <span className="text-slate-700">Total:</span>
                          <span className="text-slate-800">{subject.totalQuestions}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Mock Tests */}
            {mockTestAnalytics.recentTests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Mock Tests</h3>
                <div className="space-y-3">
                  {mockTestAnalytics.recentTests.map((test: any, index: number) => (
                    <Card key={test.testId} className="p-4 border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-blue-100 text-blue-700 border-0">{test.examType}</Badge>
                            <h4 className="font-semibold text-slate-800">{test.testTitle}</h4>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <span>Score: <span className="font-semibold text-slate-800">{test.score}/{test.maxScore}</span></span>
                            <span>Accuracy: <span className="font-semibold text-slate-800">{test.accuracy.toFixed(1)}%</span></span>
                            <span>Time: <span className="font-semibold text-slate-800">{Math.floor(test.timeTaken / 60)}m</span></span>
                            <span className="text-xs text-slate-500">{new Date(test.attemptDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-center px-3 py-2 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-emerald-600 font-medium">Correct</div>
                            <div className="text-lg font-bold text-emerald-700">{test.correctCount}</div>
                          </div>
                          <div className="text-center px-3 py-2 bg-red-50 rounded-lg">
                            <div className="text-xs text-red-600 font-medium">Wrong</div>
                            <div className="text-lg font-bold text-red-700">{test.incorrectCount}</div>
                          </div>
                          <div className="text-center px-3 py-2 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-600 font-medium">Skipped</div>
                            <div className="text-lg font-bold text-slate-700">{test.skippedCount}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Topics to Focus On */}
        {weakTopics.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Areas for growth
              </h2>
              <p className="text-slate-600">
                These topics would benefit from one more revision
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {weakTopics.slice(0, 6).map((topic: any, index: number) => {
                const getMessage = () => {
                  if (topic.trend === "improving") return "You're improving here";
                  if (topic.avgAccuracy >= 50) return "This topic needs one more revision";
                  return "Let's revisit the basics together";
                };
                
                return (
                  <Card key={topic.topicId} className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-1">{topic.topicName}</h3>
                        <p className="text-sm text-slate-500">{topic.subjectName}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 border-0">
                        {topic.avgAccuracy.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                      <Lightbulb className="h-4 w-4 flex-shrink-0" />
                      <span>{getMessage()}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        {topic.totalAttempts} practice session{topic.totalAttempts > 1 ? "s" : ""}
                      </span>
                      {topic.trend === "improving" && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <TrendingUp className="h-3 w-3" />
                          Growing
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Difficulty Performance */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              How you're doing across difficulty levels
            </h2>
            <p className="text-slate-600">
              Understanding your comfort zone helps plan better practice
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {difficultyPerformance.map((diff: any) => (
              <Card key={diff.difficulty} className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`border-0 ${
                    diff.difficulty === "easy"
                      ? "bg-emerald-50 text-emerald-700"
                      : diff.difficulty === "medium"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {diff.difficulty.charAt(0).toUpperCase() + diff.difficulty.slice(1)}
                  </Badge>
                  <span className="text-2xl font-bold text-slate-800">
                    {diff.avgAccuracy.toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {diff.totalAttempts} session{diff.totalAttempts > 1 ? "s" : ""}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Improvement Plan */}
        <Card className="p-8 border border-slate-200 bg-gradient-to-br from-blue-50/40 to-slate-50 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-6">
            <div className="rounded-full bg-blue-100 p-4">
              <Brain className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Personalized suggestions
              </h2>
              <p className="text-slate-600 mb-6">
                Thoughtful recommendations based on your learning journey
              </p>

              {!improvementPlan ? (
                <Button
                  onClick={generateImprovementPlan}
                  disabled={generatingPlan}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get suggestions
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">What we noticed</h3>
                    <p className="text-slate-700 leading-relaxed">{improvementPlan.summary}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Suggested focus areas</h3>
                    <div className="space-y-3">
                      {improvementPlan.priorityTopics.map((topic: any, index: number) => (
                        <Card key={index} className="p-4 bg-white border-slate-200">
                          <div className="flex items-start gap-3">
                            <Badge className="bg-slate-100 text-slate-700 border-0">{index + 1}</Badge>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">
                                {topic.topicName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{topic.subjectName}</p>
                              <p className="text-sm text-slate-600 mt-2">{topic.reason}</p>
                              <ul className="mt-3 space-y-2">
                                {topic.actionItems.map((item: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Gentle reminders</h3>
                      <ul className="space-y-2">
                        {improvementPlan.accuracyImprovementTips.map((tip: string, index: number) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Pacing yourself</h3>
                      <ul className="space-y-2">
                        {improvementPlan.timeManagementTips.map((tip: string, index: number) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                            <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={generateImprovementPlan}
                    variant="outline"
                    className="mt-4 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Refresh suggestions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
