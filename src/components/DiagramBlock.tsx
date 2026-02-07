"use client";

import * as React from "react";
import { Shapes, Info } from "lucide-react";

// Simple SVG diagrams for common pharmaceutical concepts
const DiagramSVGs = {
  micelle: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      {/* Micelle circle */}
      <circle cx="200" cy="150" r="80" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" strokeWidth="2" />
      
      {/* Hydrophobic core */}
      <circle cx="200" cy="150" r="40" fill="#EF4444" opacity="0.3" />
      <text x="200" y="155" textAnchor="middle" fontSize="12" fill="#991B1B" fontWeight="bold">
        Hydrophobic
      </text>
      
      {/* Hydrophilic heads (around circle) */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * Math.PI / 180;
        const x = 200 + Math.cos(angle) * 70;
        const y = 150 + Math.sin(angle) * 70;
        return <circle key={i} cx={x} cy={y} r="8" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />;
      })}
      
      {/* Labels */}
      <text x="200" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
        Micelle Structure
      </text>
      <text x="200" y="260" textAnchor="middle" fontSize="11" fill="#64748B">
        Hydrophilic heads (blue) | Hydrophobic tails (red core)
      </text>
    </svg>
  ),
  
  surface_tension: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      {/* Water surface */}
      <rect x="50" y="150" width="300" height="100" fill="#3B82F6" opacity="0.3" />
      <line x1="50" y1="150" x2="350" y2="150" stroke="#3B82F6" strokeWidth="3" strokeDasharray="5,5" />
      
      {/* Molecules at surface */}
      {[...Array(8)].map((_, i) => (
        <circle key={`surface-${i}`} cx={70 + i * 40} cy="150" r="8" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2" />
      ))}
      
      {/* Molecules in bulk */}
      {[...Array(6)].map((_, i) => (
        <circle key={`bulk-${i}`} cx={90 + i * 40} cy="190" r="8" fill="#60A5FA" stroke="#3B82F6" strokeWidth="1.5" />
      ))}
      
      {/* Force arrows on surface molecule */}
      <line x1="150" y1="150" x2="120" y2="150" stroke="#EF4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <line x1="150" y1="150" x2="180" y2="150" stroke="#EF4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <line x1="150" y1="150" x2="150" y2="180" stroke="#EF4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
      
      {/* Labels */}
      <text x="200" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B">
        Surface Tension
      </text>
      <text x="50" y="140" fontSize="11" fill="#64748B">Air</text>
      <text x="50" y="170" fontSize="11" fill="#64748B">Liquid</text>
      <text x="200" y="280" textAnchor="middle" fontSize="11" fill="#64748B">
        Net inward force creates surface tension
      </text>
      
      {/* Arrow marker definition */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
        </marker>
      </defs>
    </svg>
  ),
  
  emulsion: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      {/* O/W Emulsion (left) */}
      <text x="100" y="30" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1E293B">O/W Emulsion</text>
      <rect x="40" y="50" width="120" height="180" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" strokeWidth="2" rx="8" />
      {/* Oil droplets in water */}
      {[...Array(6)].map((_, i) => (
        <circle key={`ow-${i}`} cx={60 + (i % 3) * 30} cy={80 + Math.floor(i / 3) * 60} r="15" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
      ))}
      <text x="100" y="260" textAnchor="middle" fontSize="10" fill="#64748B">Oil in Water</text>
      
      {/* W/O Emulsion (right) */}
      <text x="300" y="30" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1E293B">W/O Emulsion</text>
      <rect x="240" y="50" width="120" height="180" fill="#FCD34D" opacity="0.3" stroke="#F59E0B" strokeWidth="2" rx="8" />
      {/* Water droplets in oil */}
      {[...Array(6)].map((_, i) => (
        <circle key={`wo-${i}`} cx={260 + (i % 3) * 30} cy={80 + Math.floor(i / 3) * 60} r="15" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2" />
      ))}
      <text x="300" y="260" textAnchor="middle" fontSize="10" fill="#64748B">Water in Oil</text>
    </svg>
  ),
  
  adsorption: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      <rect x="50" y="150" width="300" height="100" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" rx="4" />
      <text x="200" y="140" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1E293B">Adsorbent Surface</text>
      {[...Array(15)].map((_, i) => (
        <circle key={i} cx={70 + (i % 10) * 28} cy={180 + Math.floor(i / 10) * 40} r="8" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />
      ))}
      <text x="200" y="280" textAnchor="middle" fontSize="11" fill="#64748B">Molecules adsorbed on surface</text>
    </svg>
  ),
  
  contact_angle: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      <line x1="50" y1="200" x2="350" y2="200" stroke="#64748B" strokeWidth="3" />
      <ellipse cx="200" cy="200" rx="60" ry="40" fill="#3B82F6" opacity="0.5" stroke="#1E40AF" strokeWidth="2" />
      <line x1="140" y1="200" x2="180" y2="160" stroke="#EF4444" strokeWidth="2" strokeDasharray="4" />
      <path d="M 160 200 A 40 40 0 0 1 180 170" fill="none" stroke="#10B981" strokeWidth="2" />
      <text x="165" y="185" fontSize="12" fill="#10B981" fontWeight="bold">θ</text>
      <text x="200" y="260" textAnchor="middle" fontSize="11" fill="#64748B">Contact angle (θ) on surface</text>
    </svg>
  ),
  
  generic: (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      <rect x="50" y="50" width="300" height="200" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" rx="8" />
      <text x="200" y="150" textAnchor="middle" fontSize="16" fill="#64748B" fontWeight="500">
        Concept Diagram
      </text>
      <text x="200" y="180" textAnchor="middle" fontSize="12" fill="#94A3B8">
        (Visual representation for GPAT understanding)
      </text>
    </svg>
  ),
};

export default function DiagramBlock({
  diagramType,
  title,
  description,
  caption,
  gpatAngle,
  keyRecall,
  svgAsset,
}: {
  diagramType: "micelle" | "surface_tension" | "emulsion" | "adsorption" | "contact_angle" | "generic";
  title?: string;
  description?: string;
  caption?: string;
  gpatAngle?: string[];
  keyRecall?: string[];
  svgAsset?: string;
}) {
  const [showDiagram, setShowDiagram] = React.useState(false);
  const diagram = DiagramSVGs[diagramType] || DiagramSVGs.generic;
  const hasSvgAsset = !!svgAsset;
  
  return (
    <div className="my-8 p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-purple-600">
          <Shapes className="h-5 w-5 text-white" />
        </div>
        <h4 className="text-lg font-bold text-purple-900">{title}</h4>
      </div>

      {/* Description (Always visible) */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-purple-200 mb-4">
        <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
      </div>

      {/* GPAT Exam Angle */}
      {gpatAngle && gpatAngle.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-bold text-amber-900 mb-2">🎯 GPAT Exam Angle:</p>
          <ul className="space-y-1">
            {gpatAngle.map((point, idx) => (
              <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-600 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Recall */}
      {keyRecall && keyRecall.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs font-bold text-green-900 mb-2">🔑 Key Recall:</p>
          <ul className="space-y-1">
            {keyRecall.map((point, idx) => (
              <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                <span className="text-green-600 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SVG Diagram (Toggle-able) */}
      {(hasSvgAsset || diagramType !== 'generic') && (
        <div className="mb-4">
          {!showDiagram ? (
            <button
              onClick={() => setShowDiagram(true)}
              className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Shapes className="h-4 w-4" />
              Show Diagram
            </button>
          ) : (
            <div className="bg-white rounded-lg p-6 border border-purple-300 shadow-inner animate-in fade-in duration-300">
              {svgAsset ? (
                <img
                  src={`/chemistry/${svgAsset}`}
                  alt={title}
                  className="w-full h-auto max-h-[400px] object-contain"
                  onError={(e) => {
                    // Fallback to built-in SVG if asset fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={svgAsset ? 'hidden' : ''}>
                {diagram}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      {caption && (
        <p className="text-xs text-center text-slate-500 italic">{caption}</p>
      )}

      {/* GPAT Understanding Note */}
      <p className="mt-3 text-xs text-center text-slate-500">
        (Visual representation simplified for GPAT understanding)
      </p>
    </div>
  );
}
