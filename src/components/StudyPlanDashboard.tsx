"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import {
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Brain,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Loader2,
  BookOpen,
  LineChart,
  ArrowLeft,
  Home,
  Lightbulb,
} from "lucide-react";

interface StudyPlanData {
  currentDate: string;
  dailyGoals: any[];
  weeklyGoals: any[];
  weakSpots: any[];
  mistakePatterns: any[];
  focusAreas: any[];
  progressMilestones: any[];
}

export default function StudyPlanDashboard() {
  const [studyPlan, setStudyPlan] = React.useState<StudyPlanData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(0);

  React.useEffect(() => {
    fetchStudyPlan();
  }, []);

  const fetchStudyPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/study-plan");
      const data = await res.json();

      if (data.ok && data.studyPlan) {
        setStudyPlan(data.studyPlan);
      } else {
        toast.error(data.message || "Failed to load study plan");
      }
    } catch (error) {
      console.error("Error fetching study plan:", error);
      toast.error("Failed to load study plan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your personalized study plan...</p>
        </div>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
        <Card className="p-12 text-center max-w-2xl">
          <Brain className="h-16 w-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            No Study Plan Yet
          </h2>
          <p className="text-slate-600 mb-8">
            Complete some practice tests to generate your personalized study plan
          </p>
          <Button onClick={() => (window.location.href = "/subjects")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Start Practicing
          </Button>
        </Card>
      </div>
    );
  }

  const todayGoals = studyPlan.dailyGoals[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Back to Analytics
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
                Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Your Study Companion
              </h1>
              <p className="text-slate-600">
                Thoughtful suggestions for your learning journey
              </p>
            </div>
            <Button onClick={fetchStudyPlan} variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Topics to revisit</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {studyPlan.weakSpots.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-blue-200 bg-blue-50/30 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Flame className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Need attention</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {studyPlan.weakSpots.filter((w) => w.priority === 1).length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Clock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Suggested time</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {studyPlan.weakSpots.reduce((sum, w) => sum + w.estimatedHours, 0)}h
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-teal-200 bg-teal-50/30 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100">
                  <Target className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-teal-700">Next milestone</p>
                  <p className="text-xs font-semibold text-teal-800">
                    {studyPlan.progressMilestones[0]?.targetDate
                      ? new Date(studyPlan.progressMilestones[0].targetDate).toLocaleDateString()
                      : "Set goal"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="daily">
              <Calendar className="h-4 w-4 mr-2" />
              Daily Goals
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <LineChart className="h-4 w-4 mr-2" />
              Weekly Plan
            </TabsTrigger>
            <TabsTrigger value="weak-spots">
              <AlertCircle className="h-4 w-4 mr-2" />
              Weak Spots
            </TabsTrigger>
            <TabsTrigger value="focus">
              <Brain className="h-4 w-4 mr-2" />
              Focus Areas
            </TabsTrigger>
          </TabsList>

          {/* Daily Goals Tab */}
          <TabsContent value="daily">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-6">
              {studyPlan.dailyGoals.map((day, index) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(index)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedDay === index
                      ? "border-blue-400 bg-blue-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-xs text-slate-600 mb-1">
                      {index === 0 ? "Today" : `Day ${index + 1}`}
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{day.totalTimeEstimate}min</p>
                  </div>
                </button>
              ))}
            </div>

            {todayGoals && (
              <Card className="p-6 border border-slate-200 bg-white">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {selectedDay === 0 ? "Today's focus" : `Day ${selectedDay + 1} focus`}
                  </h3>
                  <p className="text-slate-700 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    {todayGoals.focus}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Suggested time: {todayGoals.totalTimeEstimate} minutes (feel free to adjust)
                  </p>
                </div>

                <div className="space-y-4">
                  {todayGoals.goals.map((goal: any, idx: number) => {
                    const isOptional = goal.priority === "low" || goal.priority === "medium";
                    const labelText = goal.priority === "high" 
                      ? "Today's focus" 
                      : goal.priority === "medium"
                      ? "Quick win revision"
                      : "Optional if energy allows";
                    
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border transition-shadow hover:shadow-md ${
                          goal.priority === "high"
                            ? "border-blue-200 bg-blue-50/30"
                            : goal.priority === "medium"
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-slate-200 bg-slate-50/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {goal.type === "revision" && (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            )}
                            {goal.type === "practice" && (
                              <Brain className="h-5 w-5 text-blue-600" />
                            )}
                            {goal.type === "mock_test" && (
                              <Award className="h-5 w-5 text-blue-600" />
                            )}
                            {goal.type === "analysis" && (
                              <LineChart className="h-5 w-5 text-emerald-600" />
                            )}
                            <div>
                              <h4 className="font-semibold text-slate-800 capitalize">
                                {goal.type.replace("_", " ")}
                              </h4>
                              {goal.topicName && (
                                <p className="text-xs text-slate-600">
                                  {goal.subjectName} • {goal.topicName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={`border-0 ${
                              goal.priority === "high"
                                ? "bg-blue-100 text-blue-700"
                                : goal.priority === "medium"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {labelText}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-800 font-medium mb-2">
                          {goal.target}
                        </p>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                          {goal.reason}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            About {goal.timeEstimate} minutes
                          </span>
                          {isOptional && (
                            <span className="text-slate-500 italic">
                              No pressure
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Lighter Day Option */}
                <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="font-semibold text-slate-800 mb-2">Not feeling up to it today?</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    That's okay. Here's a lighter option - just pick one thing:
                  </p>
                  <ul className="space-y-2">
                    {todayGoals.goals.filter((g: any) => g.priority === "high").slice(0, 1).map((goal: any, idx: number) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {goal.topicName ? `Quick 15-minute review of ${goal.topicName}` : "15-minute practice session"}
                        </span>
                      </li>
                    ))}
                    <li className="text-sm text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Or just review your notes - that counts too</span>
                    </li>
                  </ul>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Weekly Goals Tab */}
          <TabsContent value="weekly">
            <div className="mb-6">
              <p className="text-slate-600">
                A gentle roadmap for the coming weeks - adjust as needed
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studyPlan.weeklyGoals.map((week) => (
                <Card
                  key={week.weekNumber}
                  className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      Week {week.weekNumber}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {new Date(week.startDate).toLocaleDateString()} -{" "}
                      {new Date(week.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-4 p-4 rounded-lg bg-blue-50">
                    <p className="text-sm font-semibold text-slate-800 mb-2">
                      Main theme:
                    </p>
                    <p className="text-sm text-slate-700">{week.overallFocus}</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-semibold text-slate-800">Topics to explore:</p>
                    {week.targetTopics.map((topic: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {topic.topicName}
                        </p>
                        <p className="text-xs text-slate-600 mb-2">
                          {topic.subjectName}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            Currently: {topic.currentAccuracy.toFixed(0)}%
                          </span>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                          <span className="text-emerald-700 font-semibold">
                            Aiming for: {topic.targetAccuracy}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-600">Mock tests</p>
                      <p className="text-lg font-bold text-slate-800">
                        {week.mockTestsTarget}
                      </p>
                      <p className="text-xs text-slate-500">if comfortable</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-600">Quick reviews</p>
                      <p className="text-lg font-bold text-slate-800">
                        {week.revisionsTarget}
                      </p>
                      <p className="text-xs text-slate-500">when you can</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Weak Spots Tab */}
          <TabsContent value="weak-spots">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Topics that could use more love
              </h3>
              <p className="text-slate-600">
                No judgment - everyone has areas to work on. Let's tackle them together.
              </p>
            </div>

            <div className="space-y-4">
              {studyPlan.weakSpots.map((spot) => (
                <Card
                  key={spot.topicId}
                  className="p-5 border border-slate-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-slate-800">
                        {spot.topicName}
                      </h4>
                      <p className="text-sm text-slate-600">{spot.subjectName}</p>
                    </div>
                    <Badge
                      className={`border-0 ${
                        spot.priority === 1
                          ? "bg-blue-100 text-blue-700"
                          : spot.priority === 2
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {spot.priority === 1 ? "Focus area" : spot.priority === 2 ? "Worth reviewing" : "When ready"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-600">Current level</p>
                      <p className="text-lg font-bold text-slate-800">
                        {spot.accuracy.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-600">Practice sessions</p>
                      <p className="text-lg font-bold text-slate-800">
                        {spot.attemptsCount}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50">
                      <p className="text-xs text-emerald-700">Grow by</p>
                      <p className="text-lg font-bold text-emerald-700">
                        +{spot.improvementNeeded.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50">
                      <p className="text-xs text-blue-700">Suggested time</p>
                      <p className="text-lg font-bold text-blue-700">
                        {spot.estimatedHours}h
                      </p>
                    </div>
                  </div>

                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 border-0" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Let's practice {spot.topicName}
                  </Button>
                </Card>
              ))}
            </div>

            {/* Mistake Patterns */}
            {studyPlan.mistakePatterns.length > 0 && (
              <Card className="p-6 mt-6 border border-slate-200 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Patterns we noticed
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  These are just observations - small adjustments can make a big difference
                </p>
                <div className="space-y-4">
                  {studyPlan.mistakePatterns.map((pattern, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-white border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        {pattern.category}
                      </h4>
                      <div className="space-y-2">
                        {pattern.suggestions.map((suggestion: string, i: number) => (
                          <p key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Focus Areas Tab */}
          <TabsContent value="focus">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Where to put your energy
              </h3>
              <p className="text-slate-600">
                A balanced approach to help you make steady progress
              </p>
            </div>
            <div className="space-y-6">
              {studyPlan.focusAreas.map((area, idx) => (
                <Card
                  key={idx}
                  className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {area.area}
                      </h3>
                      <p className="text-sm text-slate-600">{area.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {area.timeAllocation}%
                      </p>
                      <p className="text-xs text-slate-600">suggested split</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800 mb-2">Ideas to try:</p>
                    {area.actionItems.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Progress Milestones */}
              <Card className="p-6 border border-teal-200 bg-teal-50/30">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Milestones to celebrate
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Small wins along the way - no rush, you'll get there
                </p>
                <div className="space-y-3">
                  {studyPlan.progressMilestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">{milestone.milestone}</h4>
                        <Badge variant="outline" className="ml-2 border-teal-200 text-teal-700">
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{milestone.criteria}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
