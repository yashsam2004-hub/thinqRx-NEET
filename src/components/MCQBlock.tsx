"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

export default function MCQBlock({
  question,
  options,
  correctOptionId,
  explanation,
}: {
  question: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string }>;
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
}) {
  const [selectedOptionId, setSelectedOptionId] = React.useState<"A" | "B" | "C" | "D" | null>(null);
  const [showAnswer, setShowAnswer] = React.useState(false);
  
  const isCorrect = selectedOptionId === correctOptionId;
  
  const handleCheckAnswer = () => {
    if (!selectedOptionId) return;
    setShowAnswer(true);
  };
  
  const handleReset = () => {
    setSelectedOptionId(null);
    setShowAnswer(false);
  };
  
  const correctOption = options.find(opt => opt.id === correctOptionId);
  const selectedOption = options.find(opt => opt.id === selectedOptionId);
  
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-600">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg text-slate-900 leading-relaxed">{question}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectAnswer = option.id === correctOptionId;
          
          let optionStyle = "border-2 border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm";
          
          if (showAnswer) {
            if (isCorrectAnswer) {
              optionStyle = "border-2 border-green-500 bg-green-50";
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = "border-2 border-red-500 bg-red-50";
            }
          } else if (isSelected) {
            optionStyle = "border-2 border-blue-600 bg-blue-50";
          }
          
          return (
            <button
              key={option.id}
              onClick={() => !showAnswer && setSelectedOptionId(option.id)}
              disabled={showAnswer}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${optionStyle} ${
                !showAnswer ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  showAnswer && isCorrectAnswer
                    ? "bg-green-600 text-white"
                    : showAnswer && isSelected && !isCorrectAnswer
                    ? "bg-red-600 text-white"
                    : isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {option.id}
                </div>
                <span className="text-base text-slate-900 flex-1">{option.text}</span>
                {showAnswer && isCorrectAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {showAnswer && isSelected && !isCorrectAnswer && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {showAnswer && (
        <div className="space-y-3 mb-4">
          {/* Result Status */}
          <div className={`p-4 rounded-lg border-2 ${
            isCorrect
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-bold mb-2 ${
                  isCorrect ? "text-green-900" : "text-red-900"
                }`}>
                  {isCorrect ? "✓ Correct! Well done!" : "✗ Incorrect"}
                </p>
                {!isCorrect && selectedOption && (
                  <p className="text-sm text-slate-700 mb-1">
                    <strong>Your answer:</strong> Option {selectedOption.id} - <span className="text-red-600 font-medium">{selectedOption.text}</span> (Wrong)
                  </p>
                )}
                {correctOption && (
                  <p className="text-sm text-slate-700">
                    <strong>Correct answer:</strong> Option <span className="text-green-600 font-bold">{correctOption.id}</span> - <span className="text-green-600 font-bold">{correctOption.text}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <p className="font-bold text-blue-900 mb-2">📖 Explanation:</p>
            <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        {!showAnswer ? (
          <Button
            onClick={handleCheckAnswer}
            disabled={!selectedOptionId}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="border-2"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
