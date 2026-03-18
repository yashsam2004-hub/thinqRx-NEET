"use client";

import { useEffect, useRef, useState } from "react";

interface ChemicalStructureSVGProps {
  smiles: string;
  name: string;
  width?: number;
  height?: number;
  showName?: boolean;
}

/**
 * ChemicalStructureSVG - Renders chemical structures as SVG using Kekule.js
 * 
 * For NEET Chemistry: Displays 2D skeletal structures with implicit carbons
 * and hidden hydrogens (NEET exam style)
 * 
 * @param smiles - SMILES notation of the molecule
 * @param name - Chemical name (IUPAC or common)
 * @param width - Canvas width (default: 300)
 * @param height - Canvas height (default: 250)
 * @param showName - Display chemical name below structure (default: true)
 */
export function ChemicalStructureSVG({
  smiles,
  name,
  width = 300,
  height = 250,
  showName = true,
}: ChemicalStructureSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !smiles) {
      setLoading(false);
      return;
    }

    // Dynamically import Kekule only on client side
    const loadKekule = async () => {
      try {
        // Check if Kekule is already loaded
        if (typeof window !== "undefined" && !(window as any).Kekule) {
          const Kekule = await import("kekule");
          (window as any).Kekule = Kekule;
        }

        const Kekule = (window as any).Kekule;
        if (!Kekule) {
          throw new Error("Kekule library not loaded");
        }

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Parse SMILES string
        const molecule = Kekule.IO.loadFormatData(smiles, "smi");
        
        if (!molecule) {
          throw new Error("Failed to parse SMILES notation");
        }

        // Create renderer
        const composer = new Kekule.Render.ChemObjPainter2D(
          Kekule.Render.RendererType.CANVAS
        );

        // Configure rendering options for NEET exam style
        const renderConfigs = composer.getRenderConfigs();
        if (renderConfigs) {
          renderConfigs.setConfigs({
            // Molecular display
            moleculeDisplayType: Kekule.Render.Molecule2DDisplayType.SKELETAL,
            
            // Hide hydrogens and carbons (skeletal formula)
            hideCarbons: true,
            hideExplicitHydrogens: true,
            
            // Bond styling
            bondLineWidth: 2,
            bondArrowLength: 6,
            
            // Atom styling
            atomFontSize: 14,
            atomColor: "monochrome", // Black and white for exam style
            
            // General styling
            backgroundColor: "transparent",
            color: "#1a202c", // Dark gray/black for structures
            
            // Length and spacing
            bondLength: 25,
            
            // Display options
            chargeMarkType: Kekule.Render.ChargeMarkRenderType.CIRCLE,
          });
        }

        // Set rendering dimensions
        composer.setDimension(width, height);
        composer.setChemObj(molecule);

        // Render to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        if (containerRef.current) {
          containerRef.current.appendChild(canvas);
        }

        const context = canvas.getContext("2d");
        if (context) {
          composer.draw(context);
        }

        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error rendering chemical structure:", err);
        setError(err instanceof Error ? err.message : "Failed to render structure");
        setLoading(false);
      }
    };

    loadKekule();
  }, [smiles, width, height]);

  if (error) {
    return (
      <div className="chemical-structure-error p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Structure Rendering Error</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        {showName && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Chemical: {name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="chemical-structure-svg">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        {loading && (
          <div className="flex items-center justify-center" style={{ width, height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-teal-600"></div>
          </div>
        )}
        <div 
          ref={containerRef} 
          className="flex items-center justify-center"
          style={{ minHeight: loading ? 0 : height }}
        />
      </div>
      {showName && (
        <p className="text-center text-sm font-semibold text-slate-900 dark:text-slate-100 mt-3">
          {name}
        </p>
      )}
    </div>
  );
}

/**
 * Common NEET Chemistry Compounds
 * Pre-defined SMILES for frequently used molecules
 */
export const NEET_COMMON_COMPOUNDS: Record<string, string> = {
  // Basic Organic
  "Methane": "C",
  "Ethane": "CC",
  "Ethene": "C=C",
  "Ethyne": "C#C",
  "Propane": "CCC",
  "Butane": "CCCC",
  "Benzene": "c1ccccc1",
  "Toluene": "Cc1ccccc1",
  
  // Functional Groups
  "Ethanol": "CCO",
  "Methanol": "CO",
  "Acetic Acid": "CC(=O)O",
  "Acetone": "CC(=O)C",
  "Formaldehyde": "C=O",
  "Acetaldehyde": "CC=O",
  "Methylamine": "CN",
  "Aniline": "Nc1ccccc1",
  
  // Common Reagents
  "Chloroform": "C(Cl)(Cl)Cl",
  "Carbon Tetrachloride": "C(Cl)(Cl)(Cl)Cl",
  "Phenol": "Oc1ccccc1",
  
  // Biomolecules
  "Glucose": "C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O",
  "Fructose": "C([C@@H]1[C@H]([C@@H](C(O1)(CO)O)O)O)O",
  "Glycine": "C(C(=O)O)N",
  "Alanine": "CC(C(=O)O)N",
};

/**
 * Get SMILES notation for a common compound
 */
export function getSMILES(compoundName: string): string | null {
  return NEET_COMMON_COMPOUNDS[compoundName] || null;
}
