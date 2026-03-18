"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink, Info } from "lucide-react";

export default function ImageBlock({
  url,
  alt,
  caption,
  source,
  license = "CC BY 4.0",
}: {
  url: string;
  alt: string;
  caption?: string;
  source?: string;
  license?: string;
}) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  if (imageError) {
    // Educational fallback instead of error
    return (
      <div className="my-8 p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-600">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-purple-900 mb-2">📊 Concept Diagram</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{alt}</p>
          </div>
        </div>
        {caption && (
          <div className="mt-4 p-3 rounded-lg bg-white border border-purple-200">
            <p className="text-xs text-slate-600 italic">{caption}</p>
          </div>
        )}
        <p className="mt-4 text-xs text-center text-slate-500">
          (Visual representation simplified for NEET understanding)
        </p>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-md hover:shadow-lg transition-shadow">
        {/* Image Container */}
        <div className="relative w-full" style={{ minHeight: "300px" }}>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-slate-300" />
                <p className="text-sm text-slate-500">Loading image...</p>
              </div>
            </div>
          )}
          <img
            src={url}
            alt={alt}
            className="w-full h-auto object-contain max-h-[500px]"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>

        {/* Caption and Attribution */}
        {(caption || source) && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            {caption && (
              <p className="text-sm text-slate-700 mb-2 font-medium">{caption}</p>
            )}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {license && (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                    {license}
                  </span>
                )}
              </div>
              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <span>Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
