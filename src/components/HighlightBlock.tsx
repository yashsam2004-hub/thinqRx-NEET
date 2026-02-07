"use client";

import * as React from "react";
import { AlertCircle, Lightbulb, AlertTriangle, Target, Stethoscope } from "lucide-react";

const styleConfig = {
  info: {
    bgColor: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-300",
    iconBg: "bg-blue-600",
    icon: AlertCircle,
    textColor: "text-blue-900",
  },
  tip: {
    bgColor: "from-green-50 to-emerald-50",
    borderColor: "border-green-300",
    iconBg: "bg-green-600",
    icon: Lightbulb,
    textColor: "text-green-900",
  },
  warning: {
    bgColor: "from-amber-50 to-yellow-50",
    borderColor: "border-amber-300",
    iconBg: "bg-amber-600",
    icon: AlertTriangle,
    textColor: "text-amber-900",
  },
  gpat: {
    bgColor: "from-purple-50 to-pink-50",
    borderColor: "border-purple-300",
    iconBg: "bg-purple-600",
    icon: Target,
    textColor: "text-purple-900",
  },
  clinical: {
    bgColor: "from-rose-50 to-red-50",
    borderColor: "border-rose-300",
    iconBg: "bg-rose-600",
    icon: Stethoscope,
    textColor: "text-rose-900",
  },
};

export default function HighlightBlock({
  style,
  title,
  content,
}: {
  style: "info" | "tip" | "warning" | "gpat" | "clinical";
  title: string;
  content: string;
}) {
  const config = styleConfig[style];
  const Icon = config.icon;

  return (
    <div className={`my-5 p-4 rounded-lg border-2 ${config.borderColor} bg-gradient-to-br ${config.bgColor} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded ${config.iconBg} flex-shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${config.textColor} mb-1.5`}>
            {title}
          </h4>
          <div className={`text-sm ${config.textColor} leading-relaxed whitespace-pre-wrap`}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
