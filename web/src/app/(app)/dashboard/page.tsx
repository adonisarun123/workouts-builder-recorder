import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Brain, Moon, TrendingUp, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { ReadinessGauge } from "@/components/readiness-gauge";
import { ChartEmptyPlaceholder } from "@/components/charts/dashboard-charts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Today&apos;s snapshot and long-term trajectory.</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <GlassCard hoverLift className="flex flex-col items-center justify-center p-6 sm:col-span-1 lg:col-span-1">
            <ReadinessGauge value={null} />
          </GlassCard>
          <MetricMini label="Sleep" value="—" icon={Moon} tone="default" />
          <MetricMini label="Energy" value="—" icon={Zap} tone="default" />
          <MetricMini label="Soreness" value="—" icon={TrendingUp} tone="default" />
          <GlassCard hoverLift className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Weight</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-muted-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">No entries logged</p>
          </GlassCard>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s workout</h2>
        <GlassCard hoverLift className="relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Scheduled session</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-muted-foreground md:text-3xl">No workout scheduled</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                When your coach or program assigns a session, it will show up here with duration, focus, and exercises.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                href="/workout"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-2xl px-6 text-base"
                )}
              >
                Training plan
              </Link>
              <Link
                href="/workout/session"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-2xl px-8 text-base shadow-lg shadow-primary/25"
                )}
              >
                Start Workout
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Performance summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat label="Weekly adherence" value="—" hint="No data" variant="neutral" />
          <SummaryStat label="Total volume" value="—" hint="No data" variant="neutral" />
          <SummaryStat label="PRs this week" value="—" hint="No data" variant="neutral" />
          <SummaryStat label="Avg RIR accuracy" value="—" hint="No data" variant="neutral" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progress</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard hoverLift className="p-5">
            <h3 className="font-semibold">Strength progression</h3>
            <p className="text-xs text-muted-foreground">Trends from your training log</p>
            <div className="mt-4 h-[220px] w-full">
              <ChartEmptyPlaceholder
                title="No strength history"
                subtitle="Complete workouts with logged sets to chart estimated strength over time."
                minHeight={220}
              />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5">
            <h3 className="font-semibold">Body weight</h3>
            <p className="text-xs text-muted-foreground">Trend from body metrics</p>
            <div className="mt-4 h-[200px] w-full">
              <ChartEmptyPlaceholder
                title="No weight entries"
                subtitle="Add weight in Body metrics to see a trend."
                minHeight={200}
              />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5 lg:col-span-2">
            <h3 className="font-semibold">Volume by muscle group</h3>
            <p className="text-xs text-muted-foreground">This week</p>
            <div className="mt-4 h-[220px] max-w-xl">
              <ChartEmptyPlaceholder
                title="No volume data"
                subtitle="Log sessions with exercises to break down volume by muscle group."
                minHeight={220}
              />
            </div>
          </GlassCard>
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Brain className="size-4" />
          Insights
        </h2>
        <GlassCard hoverLift className="border-dashed p-10 text-center md:p-14">
          <p className="text-sm font-medium text-muted-foreground">No insights yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground/90">
            Coaching-style feedback will appear here after you have logged readiness, workouts, and enough history for trends.
          </p>
        </GlassCard>
      </section>
    </div>
  );
}

function MetricMini({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "default" | "success" | "warn";
}) {
  const ring =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/5"
        : "border-border/60 bg-muted/20";
  return (
    <GlassCard hoverLift className={`p-5 ${ring}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground/70" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-muted-foreground">{value}</p>
    </GlassCard>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  variant,
}: {
  label: string;
  value: string;
  hint: string;
  variant: "good" | "warn" | "neutral";
}) {
  const border =
    variant === "good"
      ? "border-emerald-500/20"
      : variant === "warn"
        ? "border-amber-500/25"
        : "border-border/50";
  return (
    <GlassCard hoverLift className={`p-5 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-muted-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </GlassCard>
  );
}
