import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
