"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  Target,
  BarChart3,
  Home,
  RotateCcw,
  Loader2
} from "lucide-react";

interface AttemptData {
  id: string;
  score: number;
  timeTaken: number;
  responses: Array<{
    questionId: string;
    selectedOption: number | null;
    flagged: boolean;
  }>;
  metadata: {
    correct: number;
    incorrect: number;
    unattempted: number;
    totalQuestions: number;
    difficulty: string;
  };
}

export default function AnalysisUI({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = React.useState<AttemptData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await fetch(`/api/user-attempts/${attemptId}`);
        if (res.ok) {
          const data = await res.json();
          setAttempt(data.attempt);
        } else {
          toast.error("Failed to load test results");
        }
      } catch (error) {
        console.error("Error fetching attempt:", error);
        toast.error("Failed to load test results");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Test Not Found</h1>
          <p className="mt-2 text-slate-600">Unable to load test results.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const { metadata } = attempt;
  const totalMarks = metadata.totalQuestions * 4;
  const percentage = ((attempt.score / totalMarks) * 100).toFixed(1);
  const accuracy = metadata.correct + metadata.incorrect > 0
    ? ((metadata.correct / (metadata.correct + metadata.incorrect)) * 100).toFixed(1)
    : "0";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Test Analysis</h1>
          <p className="text-lg text-slate-600">Detailed performance breakdown</p>
        </div>

        {/* Score Card */}
        <Card className="p-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Your Score
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {attempt.score}
              </div>
              <div className="text-left">
                <div className="text-2xl font-semibold text-slate-900">/ {totalMarks}</div>
                <div className="text-sm text-slate-600">marks</div>
              </div>
            </div>
            <Badge className={`text-lg px-4 py-2 ${
              parseFloat(percentage) >= 75
                ? "bg-green-100 text-green-700 border-green-200"
                : parseFloat(percentage) >= 50
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-orange-100 text-orange-700 border-orange-200"
            } border-2`}>
              {percentage}% Score
            </Badge>
          </div>
        </Card>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <Badge className="bg-green-600 text-white">{metadata.correct}</Badge>
            </div>
            <p className="text-sm text-green-700 font-medium">Correct Answers</p>
            <p className="text-2xl font-bold text-green-900 mt-1">+{metadata.correct * 4} marks</p>
          </Card>

          <Card className="p-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <Badge className="bg-red-600 text-white">{metadata.incorrect}</Badge>
            </div>
            <p className="text-sm text-red-700 font-medium">Incorrect Answers</p>
            <p className="text-2xl font-bold text-red-900 mt-1">-{metadata.incorrect} marks</p>
          </Card>

          <Card className="p-6 border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8 text-slate-600" />
              <Badge className="bg-slate-600 text-white">{metadata.unattempted}</Badge>
            </div>
            <p className="text-sm text-slate-700 font-medium">Unattempted</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">0 marks</p>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <Badge className="bg-blue-600 text-white">{formatTime(attempt.timeTaken)}</Badge>
            </div>
            <p className="text-sm text-blue-700 font-medium">Time Taken</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {(attempt.timeTaken / metadata.totalQuestions).toFixed(0)}s/Q
            </p>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-purple-100 p-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Accuracy</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Attempted Questions</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {metadata.correct + metadata.incorrect} / {metadata.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                    style={{
                      width: `${((metadata.correct + metadata.incorrect) / metadata.totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Accuracy Rate</span>
                  <span className="text-sm font-semibold text-slate-900">{accuracy}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(accuracy) >= 75
                        ? "bg-green-600"
                        : parseFloat(accuracy) >= 50
                        ? "bg-blue-600"
                        : "bg-orange-600"
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Distribution</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden flex">
                  <div
                    className="bg-green-600 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ width: `${(metadata.correct / metadata.totalQuestions) * 100}%` }}
                  >
                    {metadata.correct > 0 && metadata.correct}
                  </div>
                  <div
                    className="bg-red-600 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ width: `${(metadata.incorrect / metadata.totalQuestions) * 100}%` }}
                  >
                    {metadata.incorrect > 0 && metadata.incorrect}
                  </div>
                  <div
                    className="bg-slate-400 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ width: `${(metadata.unattempted / metadata.totalQuestions) * 100}%` }}
                  >
                    {metadata.unattempted > 0 && metadata.unattempted}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600"></div>
                  <span className="text-slate-600">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-600"></div>
                  <span className="text-slate-600">Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-400"></div>
                  <span className="text-slate-600">Skipped</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Insights</h3>
          <div className="space-y-3 text-sm">
            {parseFloat(percentage) >= 75 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Excellent Performance!</p>
                  <p className="text-green-700">You've scored above 75%. Keep up the great work!</p>
                </div>
              </div>
            )}
            {parseFloat(accuracy) < 60 && metadata.correct + metadata.incorrect > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Target className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">Focus on Accuracy</p>
                  <p className="text-orange-700">
                    Your accuracy is {accuracy}%. Try to improve accuracy before attempting more questions.
                  </p>
                </div>
              </div>
            )}
            {metadata.unattempted > metadata.totalQuestions / 2 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Time Management</p>
                  <p className="text-blue-700">
                    You left {metadata.unattempted} questions unattempted. Practice time management.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Take Another Test
          </Button>
        </div>
      </div>
    </div>
  );
}
