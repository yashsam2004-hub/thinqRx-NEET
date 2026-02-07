/**
 * Utility functions for handling equations in AI-generated content
 */

/**
 * Common chemical equations and their LaTeX equivalents
 */
export const CHEMICAL_EQUATION_PATTERNS = {
  // Common ions
  "Ca2+": "\\ce{Ca^{2+}}",
  "Mg2+": "\\ce{Mg^{2+}}",
  "Na+": "\\ce{Na^{+}}",
  "K+": "\\ce{K^{+}}",
  "Cl-": "\\ce{Cl^{-}}",
  "CO3 2-": "\\ce{CO3^{2-}}",
  "SO4 2-": "\\ce{SO4^{2-}}",
  "PO4 3-": "\\ce{PO4^{3-}}",
  "NH4+": "\\ce{NH4^{+}}",
  
  // Equilibrium arrows
  "<->": "\\rightleftharpoons",
  "<=>": "\\rightleftharpoons",
  "->": "\\rightarrow",
  "<-": "\\leftarrow",
  
  // Common constants
  "Ksp": "K_{sp}",
  "Kw": "K_{w}",
  "Ka": "K_{a}",
  "Kb": "K_{b}",
  "Keq": "K_{eq}",
};

/**
 * Convert common pharmaceutical/chemical notation to LaTeX
 */
export function convertPharmEquationToLatex(text: string): string {
  let latex = text;

  // Replace common patterns
  for (const [pattern, replacement] of Object.entries(CHEMICAL_EQUATION_PATTERNS)) {
    latex = latex.replace(new RegExp(pattern.replace(/[+\-\[\]()]/g, "\\$&"), "g"), replacement);
  }

  // Subscripts (numbers after elements)
  latex = latex.replace(/([A-Z][a-z]?)(\d+)(?![^{]*})/g, "$1_{$2}");

  // Superscripts for charges
  latex = latex.replace(/\^(\d+[+-])(?![^{]*})/g, "^{$1}");

  // Powers
  latex = latex.replace(/\^(\d+)(?![^{]*})/g, "^{$1}");

  // Square roots
  latex = latex.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

  // Fractions
  latex = latex.replace(/(\w+)\/(\w+)/g, "\\frac{$1}{$2}");

  return latex;
}

/**
 * Validate that an equation is properly formatted
 */
export function isValidLatexEquation(equation: string): boolean {
  // Check balanced braces
  const openBraces = (equation.match(/{/g) || []).length;
  const closeBraces = (equation.match(/}/g) || []).length;
  if (openBraces !== closeBraces) return false;

  // Check for HTML tags (shouldn't be in LaTeX)
  if (/<[^>]+>/.test(equation)) return false;

  // Check for bare superscripts/subscripts
  if (/\^[^{\\]|\^$|_[^{\\]|_$/.test(equation)) return false;

  return true;
}

/**
 * Examples of correctly formatted equations for reference
 */
export const EQUATION_EXAMPLES = {
  solubility: {
    dissociation: "\\ce{AgCl(s) <=> Ag^{+}(aq) + Cl^{-}(aq)}",
    ksp: "K_{sp} = [\\ce{Ag^{+}}][\\ce{Cl^{-}}]",
    solubility: "s = \\sqrt{K_{sp}}",
    final: "K_{sp} = s^{2}",
  },
  buffer: {
    henderson: "pH = pK_{a} + \\log\\frac{[\\ce{A^{-}}]}{[\\ce{HA}]}",
    simplified: "pH = pK_{a} + \\log\\frac{[\\text{salt}]}{[\\text{acid}]}",
  },
  equilibrium: {
    generic: "\\ce{aA + bB <=> cC + dD}",
    constant: "K_{eq} = \\frac{[\\ce{C}]^{c}[\\ce{D}]^{d}}{[\\ce{A}]^{a}[\\ce{B}]^{b}}",
  },
  pharmacokinetics: {
    clearance: "CL = \\frac{0.693 \\times V_{d}}{t_{1/2}}",
    bioavailability: "F = \\frac{AUC_{oral}}{AUC_{IV}} \\times \\frac{Dose_{IV}}{Dose_{oral}}",
    loading: "LD = \\frac{C_{ss} \\times V_{d}}{F}",
  },
};
