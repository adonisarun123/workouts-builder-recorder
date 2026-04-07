import { DashboardSkeleton } from "./dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <div className="h-9 w-48 animate-pulse rounded-lg bg-muted/60" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted/40" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}
