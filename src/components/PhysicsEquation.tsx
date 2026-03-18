"use client";

import { EquationRenderer } from "./EquationRenderer";
import { useState } from "react";

interface PhysicsEquationProps {
  title: string;
  equation: string;
  description?: string;
  units?: string;
  derivation?: string[];
  constants?: Array<{ symbol: string; value: string; description: string }>;
  showDerivation?: boolean;
}

/**
 * PhysicsEquation - Enhanced equation renderer for NEET Physics
 * 
 * Features:
 * - LaTeX equation rendering via KaTeX
 * - Optional step-by-step derivation
 * - Physical constants and units display
 * - Collapsible derivation section
 * - Mobile-friendly layout
 */
export function PhysicsEquation({
  title,
  equation,
  description,
  units,
  derivation,
  constants,
  showDerivation = false,
}: PhysicsEquationProps) {
  const [isDerivationOpen, setIsDerivationOpen] = useState(showDerivation);

  return (
    <div className="physics-equation-block my-6">
      {/* Main Equation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Equation Display */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-3">
          <EquationRenderer
            equation={equation}
            block
            className="text-xl"
          />
        </div>

        {/* Units */}
        {units && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
            <span className="font-semibold">SI Units:</span>
            <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
              {units}
            </code>
          </div>
        )}

        {/* Physical Constants */}
        {constants && constants.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Constants:
            </p>
            <div className="grid gap-2">
              {constants.map((constant, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm bg-white dark:bg-slate-900 rounded-lg p-2"
                >
                  <EquationRenderer equation={constant.symbol} className="font-semibold" />
                  <span className="text-slate-600 dark:text-slate-400">=</span>
                  <code className="text-blue-600 dark:text-blue-400 font-mono">
                    {constant.value}
                  </code>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    ({constant.description})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Derivation Section */}
      {derivation && derivation.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsDerivationOpen(!isDerivationOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors w-full sm:w-auto"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isDerivationOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isDerivationOpen ? "Hide" : "Show"} Derivation
            </span>
          </button>

          {isDerivationOpen && (
            <div className="mt-3 space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Step-by-Step Derivation:
              </p>
              {derivation.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
                      <EquationRenderer equation={step} block />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Common NEET Physics Formulas
 * Pre-defined formulas with proper LaTeX notation
 */
export const NEET_PHYSICS_FORMULAS = {
  mechanics: {
    "Newton's Second Law": {
      equation: "\\vec{F} = m\\vec{a}",
      units: "N (Newton) = kg⋅m/s²",
      description: "Force equals mass times acceleration",
    },
    "Kinematic Equation 1": {
      equation: "v = u + at",
      units: "m/s",
      description: "Final velocity in uniformly accelerated motion",
    },
    "Kinematic Equation 2": {
      equation: "s = ut + \\frac{1}{2}at^2",
      units: "m (meter)",
      description: "Displacement in uniformly accelerated motion",
    },
    "Kinematic Equation 3": {
      equation: "v^2 = u^2 + 2as",
      units: "(m/s)²",
      description: "Velocity-displacement relation",
    },
    "Work-Energy Theorem": {
      equation: "W = \\Delta KE = \\frac{1}{2}m(v_f^2 - v_i^2)",
      units: "J (Joule)",
      description: "Work done equals change in kinetic energy",
    },
    "Gravitational Potential Energy": {
      equation: "U = mgh",
      units: "J (Joule)",
      description: "Potential energy near Earth's surface",
    },
  },
  thermodynamics: {
    "First Law": {
      equation: "\\Delta U = Q - W",
      units: "J (Joule)",
      description: "Energy conservation in thermodynamic processes",
    },
    "Ideal Gas Law": {
      equation: "PV = nRT",
      units: "Pa⋅m³ = mol⋅J/(mol⋅K)",
      description: "Equation of state for ideal gases",
      constants: [
        { symbol: "R", value: "8.314 J/(mol⋅K)", description: "Universal gas constant" },
      ],
    },
  },
  electromagnetism: {
    "Coulomb's Law": {
      equation: "F = k\\frac{q_1q_2}{r^2}",
      units: "N (Newton)",
      description: "Force between two point charges",
      constants: [
        { symbol: "k", value: "9 × 10⁹ N⋅m²/C²", description: "Coulomb's constant" },
      ],
    },
    "Ohm's Law": {
      equation: "V = IR",
      units: "V (Volt) = A⋅Ω",
      description: "Voltage-current relation in resistors",
    },
    "Magnetic Force": {
      equation: "\\vec{F} = q(\\vec{v} \\times \\vec{B})",
      units: "N (Newton)",
      description: "Lorentz force on a moving charge",
    },
  },
  optics: {
    "Lens Formula": {
      equation: "\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}",
      units: "m⁻¹",
      description: "Relation between object distance, image distance, and focal length",
    },
    "Magnification": {
      equation: "m = \\frac{v}{u} = \\frac{h_i}{h_o}",
      units: "dimensionless",
      description: "Linear magnification of optical systems",
    },
  },
};
