import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  hoverLift = false,
}: {
  className?: string;
  children: React.ReactNode;
  hoverLift?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-white/75 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        hoverLift && "transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/15",
        className
      )}
    >
      {children}
    </div>
  );
}
