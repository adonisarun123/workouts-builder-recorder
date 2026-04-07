import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-80 rounded-md" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-[420px] rounded-2xl" />
    </div>
  );
}
