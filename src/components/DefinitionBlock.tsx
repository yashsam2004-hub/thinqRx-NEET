"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";

export default function DefinitionBlock({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div className="my-4 p-5 rounded-lg border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded bg-indigo-600">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <dt className="font-bold text-indigo-900 mb-1 text-base">{term}</dt>
          <dd className="text-sm text-slate-700 leading-relaxed">{definition}</dd>
        </div>
      </div>
    </div>
  );
}
