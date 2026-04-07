import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="space-y-3 p-5">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-3 w-full max-w-[140px] rounded-md" />
        </GlassCard>
      ))}
      <GlassCard className="p-5 sm:col-span-2 lg:col-span-4">
        <Skeleton className="mb-4 h-4 w-40 rounded-md" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
      </GlassCard>
    </div>
  );
}
