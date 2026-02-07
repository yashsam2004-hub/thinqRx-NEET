"use client";

import * as React from "react";
import { Beaker } from "lucide-react";
import { EquationRenderer, autoConvertToLatex } from "./EquationRenderer";

export default function ReactionBlock({
  name,
  equation,
  conditions,
  description,
  note,
  reactantStructure,
  productStructure,
  structureVariant = "handwritten",
}: {
  name: string;
  equation: string;
  conditions?: string;
  description?: string;
  note?: string;
  reactantStructure?: string;
  productStructure?: string;
  structureVariant?: "handwritten" | "textbook";
}) {
  const hasStructures = reactantStructure && productStructure;

  // Auto-convert plain text to LaTeX if needed
  const latexEquation = React.useMemo(() => {
    const isAlreadyLatex = /\\|{|}/.test(equation);
    return isAlreadyLatex ? equation : autoConvertToLatex(equation);
  }, [equation]);

  return (
    <div className="my-6 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden">
      {/* Reaction Name */}
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border-b border-blue-200">
        <Beaker className="h-4 w-4 text-blue-700" />
        <h4 className="text-sm font-semibold text-blue-900">{name}</h4>
      </div>

      {/* Reaction Equation - Now using KaTeX */}
      <div className="px-6 py-6 bg-white">
        <div className="p-4 rounded bg-blue-50 border border-blue-200 overflow-x-auto">
          <EquationRenderer
            equation={latexEquation}
            block
            ariaLabel={`Chemical reaction: ${name}`}
          />
          {conditions && (
            <div className="mt-2 text-sm text-blue-700 italic text-center">
              {conditions}
            </div>
          )}
        </div>

        {/* Chemical Structures (if provided) */}
        {hasStructures && (
          <div className="mt-4 flex items-center justify-center gap-4 p-4 bg-white rounded border border-blue-100">
            {/* Reactant Structure */}
            <div className="flex-1 max-w-xs">
              <img
                src={reactantStructure}
                alt="Reactant structure"
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-2xl text-blue-600 font-bold">
              →
            </div>

            {/* Product Structure */}
            <div className="flex-1 max-w-xs">
              <img
                src={productStructure}
                alt="Product structure"
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 bg-white border-t border-blue-100">
          <p className="text-sm text-slate-700">{description}</p>
        </div>
      )}

      {/* Important Note */}
      {note && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Note:</span> {note}
          </p>
        </div>
      )}
    </div>
  );
}
