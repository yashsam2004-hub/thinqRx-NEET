"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Target,
  BarChart3,
  BookOpen,
  ArrowLeft,
  Home,
  Eye,
  Lightbulb,
} from "lucide-react";
import type { MockTest, MockTestAttempt, MockTestQuestion, QuestionResponse, SubjectPerformance } from "@/types/mock-test";

interface ResultsClientProps {
  attempt: MockTestAttempt;
  mockTest: MockTest;
}

export default function ResultsClient({
  attempt,
  mockTest,
}: ResultsClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "correct" | "incorrect" | "skipped">("all");

  const testData = mockTest.questions_json;
  const questions: MockTestQuestion[] = testData.questions || [];
  const responses: QuestionResponse[] = attempt.responses || [];
  const metadata = attempt.metadata || {
    correct_count: 0,
    incorrect_count: 0,
    skipped_count: 0,
    subject_wise_performance: [],
  };

  // Calculate time
  const timeSpentMinutes = Math.floor(attempt.time_spent_seconds / 60);
  const timeSpentHours = Math.floor(timeSpentMinutes / 60);
  const timeSpentRemainingMinutes = timeSpentMinutes % 60;

  // Get percentage
  const percentage = (attempt.score / mockTest.total_marks) * 100;

  // Prepare questions with responses
  const questionsWithResponses = questions.map((q) => {
    const response = responses.find(r => r.question_id === q.question_id);
    const isCorrect = response?.selected_option === q.correct_option;
    const isSkipped = !response || response.selected_option === null;

    return {
      question: q,
      response,
      isCorrect,
      isSkipped,
    };
  });

  // Filter questions
  const filteredQuestions = questionsWithResponses.filter((item) => {
    if (selectedFilter === "correct") return item.isCorrect;
    if (selectedFilter === "incorrect") return !item.isCorrect && !item.isSkipped;
    if (selectedFilter === "skipped") return item.isSkipped;
    return true;
  });

  // Identify strengths and weaknesses
  const subjectPerformance: SubjectPerformance[] = metadata.subject_wise_performance || [];
  const strengths = subjectPerformance.filter(s => s.accuracy >= 75).map(s => s.subject);
  const weaknesses = subjectPerformance.filter(s => s.accuracy < 60).map(s => s.subject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/mock-tests">
              <Button variant="outline" size="sm" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Back to Practice Tests
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

          <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
            Test Completed
          </Badge>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {mockTest.title}
          </h1>
          <p className="text-lg text-slate-600">
            Here's how you did
          </p>
        </div>

        {/* Score Summary */}
        <Card className="p-8 mb-8 border border-slate-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Final Score</p>
              <p className="text-4xl font-bold text-blue-700 mb-1">
                {attempt.score}
              </p>
              <p className="text-sm text-slate-600">out of {mockTest.total_marks}</p>
              <p className="text-2xl font-semibold text-blue-600 mt-2">
                {percentage.toFixed(1)}%
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-slate-600 mb-2">Correct</p>
              <p className="text-4xl font-bold text-emerald-700">
                {metadata.correct_count}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                +{(metadata.correct_count * (mockTest.marks_per_question || 4)).toFixed(1)} marks
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-slate-600 mb-2">Incorrect</p>
              <p className="text-4xl font-bold text-red-700">
                {metadata.incorrect_count}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                {metadata.incorrect_count * (mockTest.negative_marks || -1).toFixed(1)} marks
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Skipped</p>
              <p className="text-4xl font-bold text-slate-700">
                {metadata.skipped_count}
              </p>
              <p className="text-sm text-slate-600">
                0 marks
              </p>
            </div>
          </div>

          {/* Score Breakdown with Negative Marking */}
          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Score Calculation</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Correct Answers ({metadata.correct_count} × {mockTest.marks_per_question || 4}):</span>
                  <span className="font-semibold text-emerald-700">
                    +{(metadata.correct_count * (mockTest.marks_per_question || 4)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Incorrect Answers ({metadata.incorrect_count} × {mockTest.negative_marks || -1}):</span>
                  <span className="font-semibold text-red-700">
                    {(metadata.incorrect_count * (mockTest.negative_marks || -1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Skipped Answers ({metadata.skipped_count} × 0):</span>
                  <span className="font-semibold text-slate-700">0.0</span>
                </div>
                <div className="h-px bg-slate-300"></div>
                <div className="flex justify-between items-center text-base">
                  <span className="font-semibold text-slate-800">Total Score:</span>
                  <span className="font-bold text-blue-700 text-xl">{attempt.score}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4" />
                  <span>
                    Time used: {timeSpentHours > 0 ? `${timeSpentHours}h ` : ""}
                    {timeSpentRemainingMinutes}m
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Target className="h-4 w-4" />
                  <span>
                    Attempted: {metadata.correct_count + metadata.incorrect_count} / {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accuracy: {((metadata.correct_count / (metadata.correct_count + metadata.incorrect_count)) * 100 || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Subject-wise Performance */}
        <Card className="p-6 mb-8 border border-slate-200 bg-white">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Subject-wise Breakdown
          </h2>
          <div className="grid gap-4">
            {subjectPerformance.map((subject) => (
              <div
                key={subject.subject}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{subject.subject}</h3>
                  <Badge className="bg-slate-100 text-slate-700 border-0">
                    {subject.accuracy.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Correct</p>
                    <p className="text-lg font-bold text-emerald-700">{subject.correct}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Incorrect</p>
                    <p className="text-lg font-bold text-slate-700">{subject.incorrect}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Skipped</p>
                    <p className="text-lg font-bold text-slate-700">{subject.skipped}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Total</p>
                    <p className="text-lg font-bold text-slate-800">{subject.total_questions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <Card className="p-6 mb-8 border border-slate-200 bg-white">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-blue-600" />
              Insights
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {strengths.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <h3 className="font-semibold text-emerald-800 mb-2">
                    You're doing well here
                  </h3>
                  <ul className="space-y-1">
                    {strengths.map((subject) => (
                      <li key={subject} className="text-sm text-slate-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {subject}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Areas to revisit
                  </h3>
                  <ul className="space-y-1">
                    {weaknesses.map((subject) => (
                      <li key={subject} className="text-sm text-slate-700 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        {subject}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Response Sheet */}
        <Card className="p-6 mb-8 border border-slate-200 bg-white">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Response Sheet
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Overview of all your responses with marks awarded/deducted
          </p>
          
          {/* Response Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 gap-2">
            {questionsWithResponses.map((item, index) => {
              const { question, response, isCorrect, isSkipped } = item;
              const marks = isSkipped 
                ? 0 
                : isCorrect 
                ? (mockTest.marks_per_question || 4)
                : (mockTest.negative_marks || -1);

              return (
                <div
                  key={question.question_id}
                  className={`relative p-3 rounded-lg border-2 text-center ${
                    isSkipped
                      ? "border-slate-300 bg-slate-50"
                      : isCorrect
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-red-500 bg-red-50"
                  }`}
                  title={`Q${index + 1}: ${isSkipped ? 'Skipped' : isCorrect ? `Correct (+${marks})` : `Incorrect (${marks})`}`}
                >
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    Q{index + 1}
                  </div>
                  <div className={`text-lg font-bold ${
                    isSkipped
                      ? "text-slate-700"
                      : isCorrect
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}>
                    {response?.selected_option || "-"}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${
                    isSkipped
                      ? "text-slate-600"
                      : isCorrect
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}>
                    {marks > 0 ? `+${marks}` : marks}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-3">Legend:</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">A</div>
                <span className="text-slate-600">Correct (+{mockTest.marks_per_question || 4})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2 border-red-500 bg-red-50 flex items-center justify-center text-red-700 font-bold">B</div>
                <span className="text-slate-600">Incorrect ({mockTest.negative_marks || -1})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-slate-700 font-bold">-</div>
                <span className="text-slate-600">Skipped (0)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Question Review */}
        <Card className="p-6 border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              Detailed Review
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                className={selectedFilter === "all" ? "bg-blue-600 text-white border-0" : ""}
              >
                All ({questions.length})
              </Button>
              <Button
                variant={selectedFilter === "correct" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("correct")}
                className={selectedFilter === "correct" ? "bg-emerald-600 text-white border-0" : ""}
              >
                Correct ({metadata.correct_count})
              </Button>
              <Button
                variant={selectedFilter === "incorrect" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("incorrect")}
                className={selectedFilter === "incorrect" ? "bg-slate-600 text-white border-0" : ""}
              >
                Incorrect ({metadata.incorrect_count})
              </Button>
              <Button
                variant={selectedFilter === "skipped" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("skipped")}
                className={selectedFilter === "skipped" ? "bg-slate-500 text-white border-0" : ""}
              >
                Skipped ({metadata.skipped_count})
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredQuestions.map((item, index) => {
              const { question, response, isCorrect, isSkipped } = item;
              
              return (
                <Card
                  key={question.question_id}
                  className={`p-6 border-2 ${
                    isSkipped
                      ? "border-slate-200 bg-slate-50"
                      : isCorrect
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-slate-100 text-slate-700 border-0">
                        Q{questions.indexOf(question) + 1}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        {question.subject}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">
                        {question.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`border-0 ${
                        isSkipped
                          ? "bg-slate-100 text-slate-700"
                          : isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {isSkipped ? (
                          <>
                            <Circle className="h-3 w-3 mr-1" />
                            Skipped (0 marks)
                          </>
                        ) : isCorrect ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Correct (+{mockTest.marks_per_question || 4})
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect ({mockTest.negative_marks || -1})
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div
                    className="mb-4 text-slate-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                  />

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {(["A", "B", "C", "D"] as const).map((option) => {
                      const isUserAnswer = response?.selected_option === option;
                      const isCorrectAnswer = question.correct_option === option;

                      return (
                        <div
                          key={option}
                          className={`p-3 rounded-lg border ${
                            isCorrectAnswer
                              ? "border-emerald-500 bg-emerald-50"
                              : isUserAnswer
                              ? "border-slate-400 bg-slate-100"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isCorrectAnswer
                                ? "border-emerald-600 bg-emerald-600"
                                : isUserAnswer
                                ? "border-slate-500 bg-slate-500"
                                : "border-slate-300"
                            }`}>
                              {(isCorrectAnswer || isUserAnswer) && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800 mr-2">{option}.</span>
                              <span className="text-slate-700">{question.options[option]}</span>
                              {isUserAnswer && !isCorrectAnswer && (
                                <Badge className="ml-2 bg-slate-100 text-slate-700 border-0 text-xs">
                                  Your answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-0 text-xs">
                                  Correct answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Explanation
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No questions match this filter</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
