"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

type ChemicalItem = { name: string; imageUrl?: string };

export default function ChemicalBlock({ items }: { items: ChemicalItem[] }) {
  if (!items.length) return null;

  // Only show items that have image URLs
  const itemsWithImages = items.filter((item) => item.imageUrl);
  
  // If no images available, don't display the block
  if (itemsWithImages.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {itemsWithImages.map((item) => (
        <ChemicalCard key={item.name} item={item} />
      ))}
    </div>
  );
}

function ChemicalCard({ item }: { item: ChemicalItem }) {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  return (
    <div className="rounded-xl border-2 border-white/50 bg-white/80 backdrop-blur-sm p-4 hover:border-white hover:shadow-lg transition-all">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-white flex items-center justify-center relative shadow-sm">
        {error ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <AlertCircle className="h-12 w-12" />
            <p className="text-xs">Failed to load</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl!}
              alt={item.name}
              className={`h-full w-full object-contain p-2 ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
            />
          </>
        )}
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      </div>
    </div>
  );
}
