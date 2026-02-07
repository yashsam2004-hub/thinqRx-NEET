"use client";

import * as React from "react";
import { Calculator, Lightbulb } from "lucide-react";
import { EquationRenderer, autoConvertToLatex } from "./EquationRenderer";

export default function FormulaBlock({
  title,
  formula,
  description,
  gpatTip,
}: {
  title: string;
  formula: string;
  description?: string;
  gpatTip?: string;
}) {
  // Auto-convert plain text to LaTeX if needed
  const latexFormula = React.useMemo(() => {
    // Check if already LaTeX (contains backslash or braces)
    const isAlreadyLatex = /\\|{|}/.test(formula);
    return isAlreadyLatex ? formula : autoConvertToLatex(formula);
  }, [formula]);

  return (
    <div className="my-5 p-5 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded bg-blue-600">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        <h4 className="text-base font-semibold text-blue-900">{title}</h4>
      </div>

      {/* Formula - Now using KaTeX */}
      <div className="bg-white rounded-lg p-4 mb-3 border border-blue-300 shadow-sm overflow-x-auto">
        <div className="text-center">
          <EquationRenderer
            equation={latexFormula}
            block
            ariaLabel={`Formula for ${title}`}
          />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-700 mb-3 leading-relaxed">{description}</p>
      )}

      {/* Tip */}
      {gpatTip && (
        <div className="flex items-start gap-2 p-3 rounded bg-amber-50 border border-amber-200">
          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{gpatTip}</p>
        </div>
      )}
    </div>
  );
}
