"use client";

import Image from "next/image";
import { getDiagramById, type BiologyDiagram as BiologyDiagramType } from "@/lib/biology/diagrams";
import { useState } from "react";

interface BiologyDiagramProps {
  diagramId: string;
  caption?: string;
  showLabels?: boolean;
  className?: string;
}

/**
 * BiologyDiagram - Renders SVG diagrams for NEET Biology topics
 * 
 * Features:
 * - NCERT-style original SVG schematics
 * - Labeled diagrams for better understanding
 * - Dark mode compatible
 * - Mobile responsive
 * 
 * @param diagramId - Unique diagram identifier from diagrams library
 * @param caption - Optional custom caption (overrides default)
 * @param showLabels - Display diagram labels below image (default: true)
 * @param className - Additional CSS classes
 */
export function BiologyDiagram({
  diagramId,
  caption,
  showLabels = true,
  className = "",
}: BiologyDiagramProps) {
  const diagram = getDiagramById(diagramId);
  const [imageError, setImageError] = useState(false);

  if (!diagram) {
    return (
      <div className="biology-diagram-error p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Diagram Not Found</span>
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-300">
          Diagram ID "{diagramId}" not found in the library.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Please check the diagram ID or contact admin to add this diagram.
        </p>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="biology-diagram-error p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Diagram File Missing</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300">
          {diagram.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          SVG file not found at: {diagram.path}
        </p>
      </div>
    );
  }

  const categoryColor = diagram.category === "botany" 
    ? "from-green-500 to-teal-600" 
    : "from-emerald-500 to-green-600";
  
  const categoryBorder = diagram.category === "botany"
    ? "border-green-200 dark:border-green-800"
    : "border-emerald-200 dark:border-emerald-800";

  return (
    <figure className={`biology-diagram my-6 ${className}`}>
      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryColor} text-white`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {diagram.category === "botany" ? "Botany" : "Zoology"}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {diagram.subtopic}
        </span>
      </div>

      {/* Diagram Container */}
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 border-2 ${categoryBorder} shadow-sm`}>
        <div className="relative w-full" style={{ minHeight: "300px" }}>
          <Image
            src={diagram.path}
            alt={diagram.title}
            width={800}
            height={600}
            className="mx-auto object-contain"
            onError={() => setImageError(true)}
            priority={false}
          />
        </div>
      </div>

      {/* Caption and Labels */}
      <div className="mt-4">
        <figcaption className="text-center text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {caption || diagram.title}
        </figcaption>
        
        {diagram.description && (
          <p className="text-center text-xs text-slate-600 dark:text-slate-400 mb-3">
            {diagram.description}
          </p>
        )}

        {showLabels && diagram.labels && diagram.labels.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Key Labels:
            </p>
            <div className="flex flex-wrap gap-2">
              {diagram.labels.map((label, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * BiologyDiagramGrid - Display multiple diagrams in a grid
 */
export function BiologyDiagramGrid({
  diagramIds,
  columns = 2,
}: {
  diagramIds: string[];
  columns?: 1 | 2 | 3;
}) {
  const gridClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 my-6`}>
      {diagramIds.map((id) => (
        <BiologyDiagram key={id} diagramId={id} showLabels={false} />
      ))}
    </div>
  );
}
