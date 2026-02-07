"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Award,
  Flag
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface TestData {
  topicId: string;
  topicName: string;
  questions: Question[];
}

interface UserAnswer {
  questionId: string;
  selectedOption: number | null;
  flagged: boolean;
}

export default function TestUI({ topicId, topicName }: { topicId: string; topicName: string }) {
  const router = useRouter();
  
  // Test state
  const [testData, setTestData] = React.useState<TestData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [testStarted, setTestStarted] = React.useState(false);
  const [testSubmitted, setTestSubmitted] = React.useState(false);
  
  // Question navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Map<string, UserAnswer>>(new Map());
  
  // Timer
  const [timeRemaining, setTimeRemaining] = React.useState(0); // in seconds
  const [timerDuration, setTimerDuration] = React.useState(600); // 10 minutes default
  
  // Test configuration
  const [questionCount, setQuestionCount] = React.useState(10);
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");

  // Timer effect
  React.useEffect(() => {
    if (!testStarted || testSubmitted || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, testSubmitted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const generateTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          difficulty,
          count: questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.message || "Failed to generate test");
        return;
      }

      setTestData(data.test);
      setTestStarted(true);
      setTimeRemaining(questionCount * 60); // 1 minute per question
      setTimerDuration(questionCount * 60);
      
      // Initialize user answers
      const answers = new Map<string, UserAnswer>();
      data.test.questions.forEach((q: Question) => {
        answers.set(q.id, { questionId: q.id, selectedOption: null, flagged: false });
      });
      setUserAnswers(answers);
      
      toast.success("Test generated successfully!");
    } catch (error) {
      console.error("Error generating test:", error);
      toast.error("Failed to generate test");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId) || { questionId, selectedOption: null, flagged: false };
      newAnswers.set(questionId, { ...current, selectedOption: optionIndex });
      return newAnswers;
    });
  };

  const toggleFlag = (questionId: string) => {
    setUserAnswers((prev) => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId) || { questionId, selectedOption: null, flagged: false };
      newAnswers.set(questionId, { ...current, flagged: !current.flagged });
      return newAnswers;
    });
  };

  const handleSubmitTest = async () => {
    if (!testData) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit the test? This action cannot be undone."
    );

    if (!confirmed) return;

    setTestSubmitted(true);

    try {
      // Calculate score with 1/4 negative marking
      let score = 0;
      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;

      testData.questions.forEach((question) => {
        const userAnswer = userAnswers.get(question.id);
        if (userAnswer?.selectedOption === null || userAnswer?.selectedOption === undefined) {
          unattempted++;
        } else if (userAnswer.selectedOption === question.answer) {
          correct++;
          score += 4; // 4 marks for correct
        } else {
          incorrect++;
          score -= 1; // -1 mark for incorrect (1/4 negative)
        }
      });

      const attemptPayload = {
        topicId,
        kind: "ai_topic",
        score,
        timeTaken: timerDuration - timeRemaining,
        responses: Array.from(userAnswers.values()),
        metadata: {
          correct,
          incorrect,
          unattempted,
          totalQuestions: testData.questions.length,
          difficulty,
        },
      };

      console.log("[TestUI] Submitting test attempt:", attemptPayload);

      // Save attempt to database
      const attemptRes = await fetch("/api/user-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attemptPayload),
      });

      console.log("[TestUI] Response status:", attemptRes.status);

      const attemptData = await attemptRes.json();
      console.log("[TestUI] Response data:", attemptData);

      if (!attemptRes.ok) {
        console.error("[TestUI] Failed to save attempt:", attemptData);
        toast.error(attemptData.message || "Failed to save test attempt");
        return;
      }

      if (attemptData.ok && attemptData.attemptId) {
        console.log("[TestUI] Success! Attempt ID:", attemptData.attemptId);
        toast.success("Test submitted successfully!");
        // Give a small delay before navigation to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500));
      console.log("[TestUI] Redirecting to analytics...");
      router.push("/analytics");
      } else {
        console.warn("[TestUI] No attempt ID returned");
        toast.success("Test submitted!");
      }
    } catch (error) {
      console.error("[TestUI] Error submitting test:", error);
      toast.error("Failed to submit test");
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && testData && index < testData.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const currentQuestion = testData?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? userAnswers.get(currentQuestion.id) : null;

  // Statistics
  const answered = Array.from(userAnswers.values()).filter((a) => a.selectedOption !== null).length;
  const flagged = Array.from(userAnswers.values()).filter((a) => a.flagged).length;
  const unanswered = testData ? testData.questions.length - answered : 0;

  // Test configuration screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl p-8 border-2 border-slate-200 shadow-xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">
            Topic-Wise Test
          </h1>
          <p className="text-center text-slate-600 mb-8">
            {topicName}
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                      questionCount === count
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "easy", label: "Easy", color: "green" },
                  { value: "medium", label: "Medium", color: "blue" },
                  { value: "hard", label: "Hard", color: "red" },
                ].map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => setDifficulty(diff.value as any)}
                    className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                      difficulty === diff.value
                        ? `border-${diff.color}-600 bg-${diff.color}-50 text-${diff.color}-700`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Duration:</span>
                <span className="font-semibold text-slate-900">{questionCount} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Marking:</span>
                <span className="font-semibold text-slate-900">+4 / -1 (1/4 negative)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Marks:</span>
                <span className="font-semibold text-slate-900">{questionCount * 4}</span>
              </div>
            </div>

            <Button
              onClick={generateTest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generating Test...
                </>
              ) : (
                <>
                  <Award className="h-5 w-5 mr-2" />
                  Start Test
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Test interface
  if (!testData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Timer */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{topicName}</h1>
              <p className="text-sm text-slate-600">
                Question {currentQuestionIndex + 1} of {testData.questions.length}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${timeRemaining < 60 ? "text-red-600" : "text-blue-600"}`} />
                <span className={`text-2xl font-bold ${timeRemaining < 60 ? "text-red-600" : "text-slate-900"}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <Button
                onClick={handleSubmitTest}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                  Question {currentQuestionIndex + 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={currentAnswer?.flagged ? "text-orange-600" : ""}
                >
                  <Flag className={`h-4 w-4 ${currentAnswer?.flagged ? "fill-current" : ""}`} />
                </Button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-lg text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer?.selectedOption === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="text-slate-900">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  disabled={currentQuestionIndex === testData.questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Question Palette</h3>

              {/* Statistics */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Answered:</span>
                  <Badge className="bg-green-100 text-green-700">{answered}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Unanswered:</span>
                  <Badge className="bg-slate-100 text-slate-700">{unanswered}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Flagged:</span>
                  <Badge className="bg-orange-100 text-orange-700">{flagged}</Badge>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {testData.questions.map((question, index) => {
                  const answer = userAnswers.get(question.id);
                  const isAnswered = answer?.selectedOption !== null && answer?.selectedOption !== undefined;
                  const isFlagged = answer?.flagged;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg border-2 font-semibold text-sm transition-all ${
                        isCurrent
                          ? "border-blue-600 bg-blue-600 text-white"
                          : isAnswered
                          ? "border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
                          : isFlagged
                          ? "border-orange-600 bg-orange-50 text-orange-700 hover:bg-orange-100"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600"></div>
                  <span className="text-slate-600">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-600"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-50 border-2 border-orange-600"></div>
                  <span className="text-slate-600">Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-slate-200"></div>
                  <span className="text-slate-600">Not Answered</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
