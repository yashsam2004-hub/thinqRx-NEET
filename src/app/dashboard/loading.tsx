import { DashboardStatsSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg mb-2"></div>
          <div className="h-6 w-96 bg-slate-200 animate-pulse rounded-lg"></div>
        </div>

        <DashboardStatsSkeleton />

        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
