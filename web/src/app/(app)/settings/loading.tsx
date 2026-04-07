import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-80 rounded-md" />
      </div>
      <Skeleton className="min-h-[520px] rounded-2xl" />
    </div>
  );
}
