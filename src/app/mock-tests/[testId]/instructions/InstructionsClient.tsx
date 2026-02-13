"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  Clock,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Play,
  RotateCcw,
  Info,
} from "lucide-react";
import type { MockTest } from "@/types/mock-test";
import { Navigation } from "@/components/Navigation";

interface InstructionsClientProps {
  mockTest: MockTest;
  existingAttempt: { id: string; status: string; started_at: string } | null;
}

export default function InstructionsClient({
  mockTest,
  existingAttempt,
}: InstructionsClientProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const testData = mockTest.questions_json;
  const defaultInstructions = [
    `This test contains ${mockTest.total_questions} multiple-choice questions.`,
    `Each correct answer carries 4 marks.`,
    mockTest.negative_marking
      ? `There is negative marking of ${Math.abs(mockTest.negative_marking_value || -1)} mark for each incorrect answer.`
      : "There is no negative marking.",
    "You can navigate between questions using the question palette on the right.",
    "Questions can be marked for review and revisited later.",
    "The timer will show the remaining time. The test will auto-submit when time expires.",
    "Click 'Submit Test' when you are ready to finish.",
  ];

  const instructions = testData.instructions || defaultInstructions;

  const handleStartTest = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/mock-tests/${mockTest.id}/start`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.ok) {
        // Redirect to test interface
        router.push(`/mock-tests/${mockTest.id}/test?attempt=${data.attempt.id}`);
      } else {
        toast.error(data.message || "Failed to start test");
        setStarting(false);
      }
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start test");
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
      <Navigation />
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-0">
            {mockTest.exam_type}
          </Badge>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {mockTest.title}
          </h1>
          {mockTest.description && (
            <p className="text-lg text-slate-600">{mockTest.description}</p>
          )}
        </div>

        {/* Resume Notice */}
        {existingAttempt && (
          <Card className="p-6 mb-6 border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-4">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  Resume Your Session
                </h3>
                <p className="text-sm text-slate-700">
                  You have an active session for this test started on{" "}
                  {new Date(existingAttempt.started_at).toLocaleString()}.
                  You can continue from where you left off.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Test Overview */}
        <Card className="p-6 mb-6 border border-slate-200 bg-white">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Test Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
              <FileQuestion className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Questions</p>
                <p className="text-2xl font-bold text-slate-800">
                  {mockTest.total_questions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-600">Total Marks</p>
                <p className="text-2xl font-bold text-slate-800">
                  {mockTest.total_marks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
              <Clock className="h-8 w-8 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="text-2xl font-bold text-slate-800">
                  {mockTest.duration_minutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
              <AlertCircle className="h-8 w-8 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Marking</p>
                <p className="text-lg font-bold text-slate-800">
                  +4 / {mockTest.negative_marking ? mockTest.negative_marking_value : 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mb-6 border border-slate-200 bg-white">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Instructions
          </h2>
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-slate-700 leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Question Palette Legend */}
        <Card className="p-6 mb-8 border border-slate-200 bg-white">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Question Palette Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 bg-slate-200 border-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-800">Not Visited</p>
                <p className="text-xs text-slate-600">Not seen yet</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 bg-red-100 border-red-300" />
              <div>
                <p className="text-sm font-medium text-slate-800">Not Answered</p>
                <p className="text-xs text-slate-600">Visited, no answer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 bg-emerald-100 border-emerald-300" />
              <div>
                <p className="text-sm font-medium text-slate-800">Answered</p>
                <p className="text-xs text-slate-600">Answer saved</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 bg-purple-100 border-purple-300" />
              <div>
                <p className="text-sm font-medium text-slate-800">Marked</p>
                <p className="text-xs text-slate-600">For review later</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 bg-blue-100 border-blue-300" />
              <div>
                <p className="text-sm font-medium text-slate-800">Both</p>
                <p className="text-xs text-slate-600">Answered & marked</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <div className="text-center">
          <Button
            onClick={handleStartTest}
            disabled={starting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-12 py-6 gap-3 border-0"
            size="lg"
          >
            {starting ? (
              <>
                <RotateCcw className="h-5 w-5 animate-spin" />
                {existingAttempt ? "Resuming..." : "Starting..."}
              </>
            ) : (
              <>
                {existingAttempt ? (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    Resume Test
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    I'm ready to begin
                  </>
                )}
              </>
            )}
          </Button>
          <p className="text-sm text-slate-600 mt-4">
            The timer will start when you click the button above
          </p>
        </div>
      </div>
    </div>
  );
}
