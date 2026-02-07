"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface EquationRendererProps {
  /** LaTeX equation string */
  equation: string;
  /** Display as block (centered) or inline */
  block?: boolean;
  /** Optional title/label for the equation */
  title?: string;
  /** Highlight as final/important formula */
  highlightFinal?: boolean;
  /** CSS class name for custom styling */
  className?: string;
  /** Accessible description of the equation */
  ariaLabel?: string;
}

/**
 * Reusable equation renderer using KaTeX
 * Handles mathematical equations, chemical formulas, and scientific expressions
 * 
 * @example
 * <EquationRenderer equation="K_{sp} = s^{2}" block />
 * <EquationRenderer equation="Ca^{2+}" inline />
 */
export const EquationRenderer: React.FC<EquationRendererProps> = React.memo(({
  equation,
  block = false,
  title,
  highlightFinal = false,
  className = "",
  ariaLabel,
}) => {
  const [html, setHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const rendered = katex.renderToString(equation, {
        displayMode: block,
        throwOnError: false,
        errorColor: "#cc0000",
        strict: false,
        trust: false,
        output: "html",
      });
      setHtml(rendered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render equation");
      setHtml(equation); // Fallback to plain text
    }
  }, [equation, block]);

  const containerClass = `
    equation-renderer
    ${block ? "equation-block" : "equation-inline"}
    ${highlightFinal ? "equation-final" : ""}
    ${error ? "equation-error" : ""}
    ${className}
  `.trim();

  const wrapperClass = highlightFinal
    ? "finalFormula bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-4 my-4"
    : block
    ? "bg-slate-50 border border-slate-200 rounded-lg p-4 my-3"
    : "inline-block";

  if (!block && !highlightFinal) {
    // Simple inline rendering
    return (
      <span
        className={containerClass}
        dangerouslySetInnerHTML={{ __html: html }}
        role="img"
        aria-label={ariaLabel || `Mathematical expression: ${equation}`}
      />
    );
  }

  return (
    <div className={wrapperClass}>
      {title && (
        <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          {highlightFinal && <span className="text-emerald-600">⭐</span>}
          {title}
        </div>
      )}
      <div
        className={`
          ${containerClass}
          overflow-x-auto
          ${highlightFinal ? "text-xl" : "text-lg"}
          ${block ? "text-center" : ""}
          py-2
        `}
        style={{ 
          fontSize: highlightFinal ? '1.375rem' : '1.125rem',
          lineHeight: '1.8'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
        role="img"
        aria-label={ariaLabel || title || `Mathematical expression: ${equation}`}
      />
      {error && (
        <div className="text-xs text-red-600 mt-2">
          Rendering error: {error}
        </div>
      )}
    </div>
  );
});

EquationRenderer.displayName = "EquationRenderer";

/**
 * Specialized component for chemical dissociation reactions
 */
export const DissociationEquation: React.FC<{
  equation: string;
  ariaLabel?: string;
}> = ({ equation, ariaLabel }) => (
  <EquationRenderer
    equation={equation}
    block
    title="Dissociation Reaction"
    className="bg-blue-50 border-blue-200"
    ariaLabel={ariaLabel}
  />
);

/**
 * Specialized component for Ksp expressions
 */
export const KspEquation: React.FC<{
  equation: string;
  ariaLabel?: string;
}> = ({ equation, ariaLabel }) => (
  <EquationRenderer
    equation={equation}
    block
    title="Ksp Expression"
    ariaLabel={ariaLabel}
  />
);

/**
 * Specialized component for final formulas (highlighted)
 */
export const FinalFormula: React.FC<{
  equation: string;
  title?: string;
  ariaLabel?: string;
}> = ({ equation, title = "Final Formula", ariaLabel }) => (
  <EquationRenderer
    equation={equation}
    block
    highlightFinal
    title={title}
    ariaLabel={ariaLabel}
  />
);

/**
 * Utility function to convert plain text equations to LaTeX
 * Handles common patterns in scientific content
 */
export function autoConvertToLatex(text: string): string {
  let latex = text;

  // Square root with brackets: sqrt[...] → \sqrt{...}
  latex = latex.replace(/sqrt\[([^\]]+)\]/g, "\\sqrt{$1}");

  // Square root with parentheses: sqrt(...) → \sqrt{...}
  latex = latex.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

  // Square root without delimiters (greedy): sqrt{...} → \sqrt{...}
  latex = latex.replace(/sqrt\{([^}]+)\}/g, "\\sqrt{$1}");

  // Cube root and nth roots: sqrt[n](...) → \sqrt[n]{...}
  latex = latex.replace(/sqrt\[(\d+)\]\(([^)]+)\)/g, "\\sqrt[$1]{$2}");

  // Cube root: ^(1/3) → \sqrt[3]{}
  latex = latex.replace(/\^\(1\/3\)/g, "\\sqrt[3]{}");
  latex = latex.replace(/\^\{1\/3\}/g, "\\sqrt[3]{}");

  // Chemical charges: Ca^2+ → Ca^{2+}
  latex = latex.replace(/([A-Z][a-z]?)\^(\d+)([+-])/g, "$1^{$2$3}");

  // Subscripts: CO3 → CO_{3} (but not if already in braces)
  latex = latex.replace(/([A-Z][a-z]?)(\d+)(?![^{]*})/g, "$1_{$2}");

  // Powers: s^2 → s^{2} (but not if already in braces)
  latex = latex.replace(/\^(\d+)(?![^{]*})/g, "^{$1}");

  // Parentheses to brackets for better readability
  latex = latex.replace(/\(([^)]*Δ[^)]*)\)/g, "[$1]");

  // Greek letters - common ones
  latex = latex.replace(/\\?Delta(?![a-zA-Z])/g, "\\Delta");
  latex = latex.replace(/\\?delta(?![a-zA-Z])/g, "\\delta");
  latex = latex.replace(/\\?pi(?![a-zA-Z])/g, "\\pi");
  latex = latex.replace(/\\?sigma(?![a-zA-Z])/g, "\\sigma");
  latex = latex.replace(/\\?theta(?![a-zA-Z])/g, "\\theta");

  // Equilibrium arrows
  latex = latex.replace(/<->/g, "\\rightleftharpoons");
  latex = latex.replace(/⇌/g, "\\rightleftharpoons");
  latex = latex.replace(/<=/g, "\\rightleftharpoons");
  latex = latex.replace(/->/g, "\\rightarrow");
  latex = latex.replace(/→/g, "\\rightarrow");
  latex = latex.replace(/<-/g, "\\leftarrow");
  latex = latex.replace(/←/g, "\\leftarrow");

  // Multiplication symbols
  latex = latex.replace(/\*/g, "\\cdot");
  latex = latex.replace(/×/g, "\\times");
  latex = latex.replace(/·/g, "\\cdot");

  // Plus-minus
  latex = latex.replace(/±/g, "\\pm");
  latex = latex.replace(/\+\/-/g, "\\pm");

  // Fractions: (a/b) → \frac{a}{b} - only for simple cases
  latex = latex.replace(/\(([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)\)/g, "\\frac{$1}{$2}");

  return latex;
}

/**
 * Validate LaTeX equation syntax
 */
export function validateLatexEquation(equation: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unmatched braces
  const openBraces = (equation.match(/{/g) || []).length;
  const closeBraces = (equation.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push("Unmatched braces");
  }

  // Check for bare superscripts/subscripts (should use {})
  if (/\^[^{]/.test(equation) || /_[^{]/.test(equation)) {
    errors.push("Superscripts/subscripts should use braces: ^{2} not ^2");
  }

  // Check for HTML tags (should not be in LaTeX)
  if (/<sup>|<sub>|<\/sup>|<\/sub>/i.test(equation)) {
    errors.push("HTML tags found - use LaTeX notation instead");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
