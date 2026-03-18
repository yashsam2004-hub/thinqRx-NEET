"use client";

import * as React from "react";
import { AlertCircle, Lightbulb, AlertTriangle, Target, Stethoscope } from "lucide-react";

const styleConfig = {
  info: {
    bgColor: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30",
    borderColor: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-sky-600 dark:bg-sky-500",
    icon: AlertCircle,
    textColor: "text-sky-900 dark:text-sky-200",
  },
  tip: {
    bgColor: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-600 dark:bg-emerald-500",
    icon: Lightbulb,
    textColor: "text-emerald-900 dark:text-emerald-200",
  },
  warning: {
    bgColor: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    iconBg: "bg-orange-600 dark:bg-orange-500",
    icon: AlertTriangle,
    textColor: "text-orange-900 dark:text-orange-200",
  },
  exam: {
    bgColor: "from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50",
    borderColor: "border-blue-400 dark:border-blue-700",
    iconBg: "bg-blue-600 dark:bg-blue-500",
    icon: Target,
    textColor: "text-blue-900 dark:text-blue-100",
  },
  clinical: {
    bgColor: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    iconBg: "bg-teal-600 dark:bg-teal-500",
    icon: Stethoscope,
    textColor: "text-teal-900 dark:text-teal-200",
  },
};

export default function HighlightBlock({
  style,
  title,
  content,
}: {
  style: "info" | "tip" | "warning" | "exam" | "clinical";
  title: string;
  content: string;
}) {
  const config = styleConfig[style];
  const Icon = config.icon;

  // Exam style gets special prominent treatment (Blue Cards for Quick Revision)
  const isExam = style === "exam";
  const isWarning = style === "warning";

  return (
    <div 
      className={`my-5 p-5 rounded-xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgColor} ${
        isExam ? 'shadow-md hover:shadow-lg' : 'shadow-sm'
      } transition-shadow`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.iconBg} flex-shrink-0 ${isExam ? 'shadow-sm' : ''}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`text-base font-bold ${config.textColor} mb-2 ${isExam ? 'tracking-tight' : ''}`}>
            {isWarning && '⚠️ '}{title}
          </h4>
          <div className={`text-sm ${config.textColor} leading-relaxed whitespace-pre-wrap ${isExam ? 'font-medium' : ''}`}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
