import { TestCardSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg mb-4"></div>
          <div className="h-6 w-96 bg-slate-200 animate-pulse rounded-lg mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TestCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
