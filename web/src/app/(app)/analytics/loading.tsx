import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-96 rounded-md" />
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}
