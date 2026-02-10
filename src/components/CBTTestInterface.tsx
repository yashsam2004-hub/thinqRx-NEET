"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Flag,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { MockTest, MockTestAttempt, MockTestQuestion, QuestionState, QuestionResponse } from "@/types/mock-test";
import { QUESTION_STATUS_COLORS } from "@/types/mock-test";

interface CBTTestInterfaceProps {
  attempt: MockTestAttempt;
  mockTest: MockTest;
}

export default function CBTTestInterface({
  attempt,
  mockTest,
}: CBTTestInterfaceProps) {
  const router = useRouter();
  const testData = mockTest.questions_json;
  const questions: MockTestQuestion[] = testData.questions || [];

  // Core state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    attempt.session_state?.current_question_index || 0
  );
  const [timeRemaining, setTimeRemaining] = useState(
    attempt.session_state?.time_remaining_seconds || mockTest.duration_minutes * 60
  );
  const [responses, setResponses] = useState<Map<string, QuestionResponse>>(
    new Map(attempt.responses?.map((r: QuestionResponse) => [r.question_id, r]) || [])
  );
  const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(
    new Map()
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize question states
  useEffect(() => {
    const statesMap = new Map<string, QuestionState>();
    questions.forEach((q) => {
      const response = responses.get(q.question_id);
      const hasAnswer = response?.selected_option !== null && response?.selected_option !== undefined;
      const isMarked = response?.is_marked_for_review || false;
      
      let status: QuestionState["status"] = "not_visited";
      if (response?.visited_at) {
        if (hasAnswer && isMarked) {
          status = "answered_and_marked";
        } else if (hasAnswer) {
          status = "answered";
        } else if (isMarked) {
          status = "marked_for_review";
        } else {
          status = "not_answered";
        }
      }

      statesMap.set(q.question_id, {
        question_id: q.question_id,
        status,
        selected_option: response?.selected_option || null,
        is_marked_for_review: isMarked,
        time_spent_seconds: response?.time_spent_seconds || 0,
      });
    });
    setQuestionStates(statesMap);
  }, [questions, responses]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save every 10 seconds (FIXED: Use useRef to prevent interval recreation)
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responsesRef = useRef(responses);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const timeRemainingRef = useRef(timeRemaining);

  // Keep refs in sync with state
  useEffect(() => {
    responsesRef.current = responses;
    currentQuestionIndexRef.current = currentQuestionIndex;
    timeRemainingRef.current = timeRemaining;
  }, [responses, currentQuestionIndex, timeRemaining]);

  // Start auto-save interval ONCE on mount
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []); // Empty deps = runs once

  const saveProgress = useCallback(async () => {
    try {
      setIsSaving(true);
      const responsesArray = Array.from(responses.values());
      
      const response = await fetch(`/api/mock-tests/${mockTest.id}/save`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attempt.id,
          responses: responsesArray,
          session_state: {
            current_question_index: currentQuestionIndex,
            time_remaining_seconds: timeRemaining,
            last_saved_at: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress. Your answers may not be saved.", {
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [responses, currentQuestionIndex, timeRemaining, attempt.id, mockTest.id]);

  const handleAutoSubmit = async () => {
    await saveProgress();
    toast.info("Time's up! Submitting your test...");
    
    try {
      const res = await fetch(`/api/mock-tests/${mockTest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: attempt.id }),
      });

      const data = await res.json();
      if (data.ok) {
        router.push(`/mock-tests/${mockTest.id}/result/${attempt.id}`);
      }
    } catch (error) {
      console.error("Error auto-submitting test:", error);
      toast.error("Failed to submit test");
    }
  };

  const handleOptionSelect = (option: "A" | "B" | "C" | "D") => {
    if (!currentQuestion) return;

    const newResponses = new Map(responses);
    const existingResponse = newResponses.get(currentQuestion.question_id) || {
      question_id: currentQuestion.question_id,
      selected_option: null,
      is_marked_for_review: false,
      time_spent_seconds: 0,
      visited_at: new Date().toISOString(),
    };

    newResponses.set(currentQuestion.question_id, {
      ...existingResponse,
      selected_option: option,
      answered_at: new Date().toISOString(),
    });

    setResponses(newResponses);

    // Schedule save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 1000);
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;

    const newResponses = new Map(responses);
    const existingResponse = newResponses.get(currentQuestion.question_id);
    
    if (existingResponse) {
      newResponses.set(currentQuestion.question_id, {
        ...existingResponse,
        selected_option: null,
        answered_at: undefined,
      });
      setResponses(newResponses);
      saveProgress();
    }
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;

    const newResponses = new Map(responses);
    const existingResponse = newResponses.get(currentQuestion.question_id) || {
      question_id: currentQuestion.question_id,
      selected_option: null,
      is_marked_for_review: false,
      time_spent_seconds: 0,
      visited_at: new Date().toISOString(),
    };

    const newMarkedState = !existingResponse.is_marked_for_review;
    
    newResponses.set(currentQuestion.question_id, {
      ...existingResponse,
      is_marked_for_review: newMarkedState,
    });

    setResponses(newResponses);
    
    // Show feedback toast
    toast.success(newMarkedState ? "Marked for review" : "Review mark removed", {
      duration: 1500,
      position: "top-center",
    });
    
    // Schedule save with debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 500);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      
      // Mark as visited
      const question = questions[index];
      const newResponses = new Map(responses);
      if (!newResponses.has(question.question_id)) {
        newResponses.set(question.question_id, {
          question_id: question.question_id,
          selected_option: null,
          is_marked_for_review: false,
          time_spent_seconds: 0,
          visited_at: new Date().toISOString(),
        });
        setResponses(newResponses);
      }
    }
  };

  const handleSaveAndNext = () => {
    saveProgress();
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleMarkAndNext = () => {
    // Only mark if not already marked
    if (!currentResponse?.is_marked_for_review) {
      handleMarkForReview();
    }
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        goToQuestion(currentQuestionIndex + 1);
      }, 100);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions have been visited
    const allQuestionsVisited = progress.notVisited === 0;
    
    if (!allQuestionsVisited) {
      toast.error(
        `Please visit all questions before submitting. ${progress.notVisited} question(s) not visited yet.`,
        { duration: 5000 }
      );
      return;
    }

    setSubmitting(true);
    await saveProgress();

    try {
      const res = await fetch(`/api/mock-tests/${mockTest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: attempt.id }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success("Test submitted successfully!");
        router.push(`/mock-tests/${mockTest.id}/result/${attempt.id}`);
      } else {
        toast.error(data.message || "Failed to submit test");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit test");
      setSubmitting(false);
    }
  };

  // Calculate progress
  const progress = {
    answered: Array.from(questionStates.values()).filter(
      s => s.status === "answered" || s.status === "answered_and_marked"
    ).length,
    marked: Array.from(questionStates.values()).filter(
      s => s.status === "marked_for_review" || s.status === "answered_and_marked"
    ).length,
    notAnswered: Array.from(questionStates.values()).filter(
      s => s.status === "not_answered"
    ).length,
    notVisited: Array.from(questionStates.values()).filter(
      s => s.status === "not_visited"
    ).length,
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeRemaining < 300; // < 5 minutes
  const isTimeWarning = timeRemaining < 600 && !isTimeCritical; // < 10 minutes

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const currentResponse = responses.get(currentQuestion.question_id);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {mockTest.title}
          </h1>
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0">
            {mockTest.exam_type}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Save Indicator */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {isSaving ? (
              <>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Saved {new Date().getTime() - lastSaved.getTime() < 5000 ? "just now" : `at ${lastSaved.toLocaleTimeString()}`}</span>
              </>
            ) : null}
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isTimeCritical
              ? "bg-red-100 text-red-700"
              : isTimeWarning
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-700"
          }`}>
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono font-semibold">
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <Button
            onClick={() => setShowSubmitConfirm(true)}
            variant={currentQuestionIndex === questions.length - 1 ? "default" : "outline"}
            className={`gap-2 ${
              currentQuestionIndex === questions.length - 1
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg animate-pulse"
                : ""
            }`}
          >
            <Send className="h-4 w-4" />
            Submit Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-w-4xl mx-auto shadow-lg">
            {/* Question Header */}
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-0">
                  {currentQuestion.subject}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{currentQuestion.topic}</p>
            </div>

            {/* Question Text */}
            <div
              className="mb-6 text-slate-800 dark:text-slate-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
            />

            {/* Options */}
            <div className="space-y-3 mb-6">
              {(["A", "B", "C", "D"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    currentResponse?.selected_option === option
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      currentResponse?.selected_option === option
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300"
                    }`}>
                      {currentResponse?.selected_option === option && (
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">{option}.</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {currentQuestion.options[option]}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleClearResponse}
                  variant="outline"
                  className="gap-2"
                  disabled={!currentResponse?.selected_option}
                >
                  <Eraser className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleMarkForReview}
                  variant="outline"
                  className={`gap-2 ${currentResponse?.is_marked_for_review ? 'border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100' : ''}`}
                  title={currentResponse?.is_marked_for_review ? "Remove review mark" : "Mark for review"}
                >
                  <Flag 
                    className={`h-4 w-4 ${currentResponse?.is_marked_for_review ? 'fill-purple-500 text-purple-500' : ''}`} 
                  />
                  {currentResponse?.is_marked_for_review ? "Marked" : "Mark for Review"}
                </Button>
                <Button
                  onClick={handleSaveAndNext}
                  className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white gap-2 border-0"
                >
                  Save & Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 z-10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Question Palette</h3>
            
            {/* Progress Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <div className="text-emerald-600 font-medium">Answered</div>
                <div className="text-emerald-800 font-bold text-lg">{progress.answered}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="text-purple-600 font-medium">Marked</div>
                <div className="text-purple-800 font-bold text-lg">{progress.marked}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="text-red-600 font-medium">Not Answered</div>
                <div className="text-red-800 font-bold text-lg">{progress.notAnswered}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="text-slate-600 dark:text-slate-400 font-medium">Not Visited</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-lg">{progress.notVisited}</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, index) => {
                const state = questionStates.get(q.question_id);
                const response = responses.get(q.question_id);
                const isCurrent = index === currentQuestionIndex;
                const colorClass = state ? QUESTION_STATUS_COLORS[state.status] : QUESTION_STATUS_COLORS.not_visited;
                const isMarked = response?.is_marked_for_review || false;

                return (
                  <button
                    key={q.question_id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      relative h-11 rounded-lg border-2 text-sm font-semibold transition-all
                      ${colorClass}
                      ${isCurrent ? "ring-2 ring-offset-2 ring-blue-500 scale-105" : ""}
                      hover:scale-105 hover:shadow-md
                    `}
                  >
                    {index + 1}
                    {isMarked && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <Flag className="h-2.5 w-2.5 fill-purple-600 text-purple-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-3">Legend:</p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">1</div>
                  <span className="text-slate-600">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-100 border-2 border-red-300 flex items-center justify-center text-[10px] font-bold text-red-700">2</div>
                  <span className="text-slate-600">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-[10px] font-bold text-emerald-700">3</div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700 relative">
                    4
                    <Flag className="absolute -top-0.5 -right-0.5 h-2 w-2 fill-purple-600 text-purple-600" />
                  </div>
                  <span className="text-slate-600">Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700 relative">
                    5
                    <Flag className="absolute -top-0.5 -right-0.5 h-2 w-2 fill-purple-600 text-purple-600" />
                  </div>
                  <span className="text-slate-600">Answered & Marked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className={`h-6 w-6 flex-shrink-0 mt-1 ${
                progress.notVisited > 0 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
              }`} />
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  {progress.notVisited > 0 ? "Cannot Submit Yet" : "Submit Test?"}
                </h3>
                {progress.notVisited > 0 ? (
                  <>
                    <p className="text-sm text-red-700 font-semibold mb-4">
                      You must visit all questions before submitting the test!
                    </p>
                    <p className="text-sm text-slate-600 mb-4">
                      Progress: {questions.length - progress.notVisited} / {questions.length} questions visited
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>✓ Answered: {progress.answered}</li>
                      <li>✓ Visited but not answered: {progress.notAnswered}</li>
                      <li className="text-red-600 font-semibold">⚠ Not visited: {progress.notVisited}</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-4">
                      You have answered {progress.answered} out of {questions.length} questions.
                      {progress.notAnswered > 0 && ` ${progress.notAnswered} questions were visited but not answered.`}
                    </p>
                    <p className="text-sm text-slate-700 font-medium">
                      Are you sure you want to submit? You won't be able to change answers after submission.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {progress.notVisited === 0 ? (
                <>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    {submitting ? "Submitting..." : "Yes, Submit"}
                  </Button>
                  <Button
                    onClick={() => setShowSubmitConfirm(false)}
                    disabled={submitting}
                    variant="outline"
                    className="flex-1"
                  >
                    Continue Test
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Continue Test
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
