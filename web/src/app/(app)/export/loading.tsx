import { Skeleton } from "@/components/ui/skeleton";

export default function ExportLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-md rounded-md" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
