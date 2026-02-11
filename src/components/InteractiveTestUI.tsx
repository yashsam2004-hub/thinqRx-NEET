"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Home
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string }>;
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
}

interface TestData {
  topicId: string;
  topicName: string;
  questions: Question[];
}

export default function InteractiveTestUI({ 
  topicId, 
  topicName 
}: { 
  topicId: string; 
  topicName: string;
}) {
  const router = useRouter();
  
  // Test state
  const [testData, setTestData] = React.useState<TestData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [testStarted, setTestStarted] = React.useState(false);
  
  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOptionId, setSelectedOptionId] = React.useState<"A" | "B" | "C" | "D" | null>(null);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [testCompleted, setTestCompleted] = React.useState(false);
  
  // Test configuration
  const [questionCount, setQuestionCount] = React.useState(10);
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");

  const generateTest = async () => {
    setLoading(true);
    try {
      const payload = {
        topicId,
        difficulty,
        count: questionCount,
      };
      
      console.log("[InteractiveTestUI] Generating test with:", payload);
      
      const res = await fetch("/api/ai/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[InteractiveTestUI] Response status:", res.status);
      
      const data = await res.json();
      console.log("[InteractiveTestUI] Response data:", data);

      if (!res.ok || !data.ok) {
        console.error("[InteractiveTestUI] Test generation failed:", data);
        toast.error(data.message || data.error || "Failed to generate test");
        if (data.details) {
          console.error("[InteractiveTestUI] Error details:", data.details);
        }
        return;
      }

      setTestData(data.test);
      setTestStarted(true);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedOptionId(null);
      setShowAnswer(false);
      
      toast.success("Test generated! Let's begin!");
    } catch (error) {
      console.error("[InteractiveTestUI] Error generating test:", error);
      toast.error("Failed to generate test");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionId === null) {
      toast.error("Please select an answer");
      return;
    }
    
    const currentQuestion = testData?.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // Check if answer is correct (compare option IDs)
    if (selectedOptionId === currentQuestion.correctOptionId) {
      setScore((prev) => prev + 1);
    }
    
    setShowAnswer(true);
  };

  const handleNextQuestion = async () => {
    if (!testData) return;
    
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setShowAnswer(false);
    } else {
      // Test completed - Save to database
      setTestCompleted(true);
      
      // Save attempt to database for analytics
      try {
        const correct = score;
        const totalQuestions = testData.questions.length;
        const incorrect = totalQuestions - correct;
        const calculatedScore = (correct * 4) - incorrect; // GPAT marking: +4 correct, -1 wrong
        
        console.log("[InteractiveTestUI] Saving test attempt:", {
          topicId,
          score: calculatedScore,
          correct,
          incorrect,
          totalQuestions,
        });
        
        const attemptRes = await fetch("/api/user-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            kind: "ai_topic",
            score: calculatedScore,
            timeTaken: 0, // Interactive test doesn't track time
            responses: [], // Don't save individual responses for interactive tests
            metadata: {
              correct,
              incorrect,
              unattempted: 0,
              totalQuestions,
              difficulty,
            },
          }),
        });
        
        const attemptData = await attemptRes.json();
        console.log("[InteractiveTestUI] Save response:", attemptData);
        
        if (attemptRes.ok && attemptData.ok) {
          console.log("[InteractiveTestUI] ✅ Test attempt saved! ID:", attemptData.attemptId);
        } else {
          console.error("[InteractiveTestUI] ❌ Failed to save attempt:", attemptData);
        }
      } catch (error) {
        console.error("[InteractiveTestUI] Error saving attempt:", error);
      }
    }
  };

  const handleRestartTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setShowAnswer(false);
    setTestData(null);
  };

  const currentQuestion = testData?.questions[currentQuestionIndex];
  const isCorrect = selectedOptionId === currentQuestion?.correctOptionId;
  const percentage = testData ? Math.round((score / testData.questions.length) * 100) : 0;
  
  const correctOption = currentQuestion?.options.find(opt => opt.id === currentQuestion.correctOptionId);
  const selectedOption = currentQuestion?.options.find(opt => opt.id === selectedOptionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <Navigation />
      
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Pre-test Configuration */}
        {!testStarted && !testCompleted && (
          <Card className="p-8 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Practice Test
              </Badge>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">{topicName}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Interactive quiz with instant feedback
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Question Count */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15].map((count) => (
                    <Button
                      key={count}
                      variant={questionCount === count ? "default" : "outline"}
                      onClick={() => setQuestionCount(count)}
                      className={questionCount === count ? "bg-blue-600" : ""}
                    >
                      {count} Questions
                    </Button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <Button
                      key={diff}
                      variant={difficulty === diff ? "default" : "outline"}
                      onClick={() => setDifficulty(diff)}
                      className={
                        difficulty === diff
                          ? diff === "easy"
                            ? "bg-green-600"
                            : diff === "medium"
                            ? "bg-orange-600"
                            : "bg-red-600"
                          : ""
                      }
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={generateTest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Practice Test
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Active Test */}
        {testStarted && !testCompleted && currentQuestion && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <Card className="p-4 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Question {currentQuestionIndex + 1} of {testData?.questions.length}
                </span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Score: {score}/{testData?.questions.length}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / (testData?.questions.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </Card>

            {/* Question Card */}
            <Card className="p-8 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700">
              <div className="mb-6">
                <Badge className="mb-4 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                  Question {currentQuestionIndex + 1}
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isCorrectAnswer = option.id === currentQuestion.correctOptionId;
                  
                  let optionStyle = "border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800/50";
                  
                  if (showAnswer) {
                    if (isCorrectAnswer) {
                      optionStyle = "border-2 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30";
                    } else if (isSelected && !isCorrectAnswer) {
                      optionStyle = "border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-2 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30";
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => !showAnswer && setSelectedOptionId(option.id)}
                      disabled={showAnswer}
                      className={`w-full text-left p-4 rounded-xl transition-all ${optionStyle} ${
                        !showAnswer ? "cursor-pointer hover:shadow-md" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          showAnswer && isCorrectAnswer
                            ? "bg-green-600 text-white"
                            : showAnswer && isSelected && !isCorrectAnswer
                            ? "bg-red-600 text-white"
                            : isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}>
                          {option.id}
                        </div>
                        <span className="flex-1 text-lg text-slate-900 dark:text-white">{option.text}</span>
                        {showAnswer && isCorrectAnswer && (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        )}
                        {showAnswer && isSelected && !isCorrectAnswer && (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (shown after answer) */}
              {showAnswer && (
                <div className="space-y-4">
                  {/* Result Badge */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isCorrect
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div>
                        <h3 className={`font-bold text-lg mb-2 ${
                          isCorrect ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"
                        }`}>
                          {isCorrect ? "✓ Correct! Well done!" : "✗ Incorrect"}
                        </h3>
                        {!isCorrect && selectedOption && (
                          <p className="text-slate-700 dark:text-slate-300 mb-2">
                            <strong>Your answer:</strong> Option {selectedOption.id} - <span className="text-red-600 dark:text-red-400 font-medium">{selectedOption.text}</span> (Wrong)
                          </p>
                        )}
                        {correctOption && (
                          <p className="text-slate-700 dark:text-slate-300">
                            <strong>Correct answer:</strong> Option <span className="text-green-600 dark:text-green-400 font-bold">{correctOption.id}</span> - <span className="text-green-600 dark:text-green-400 font-medium">{correctOption.text}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Explanation */}
                  <div className="p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Explanation
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {!showAnswer ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOptionId === null}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
                  >
                    Submit Answer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 py-6 text-lg"
                  >
                    {currentQuestionIndex < (testData?.questions.length || 0) - 1
                      ? "Next Question"
                      : "Finish Test"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Test Completed */}
        {testCompleted && testData && (
          <Card className="p-8 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Test Completed!</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">Great job on completing the practice test</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{score}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Correct</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{percentage}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Score</div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{testData.questions.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Total</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRestartTest}
                variant="outline"
                className="flex-1 border-2 py-6 text-lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/analytics")}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                View Analytics
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
