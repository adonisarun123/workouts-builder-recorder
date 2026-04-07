import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Brain, Moon, TrendingUp, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadinessGauge } from "@/components/readiness-gauge";
import { BodyWeightChart, StrengthProgressChart, VolumeByMuscleChart } from "@/components/charts/dashboard-charts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Today&apos;s snapshot and long-term trajectory.</p>
      </div>

      {/* Section 1 */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <GlassCard hoverLift className="flex flex-col items-center justify-center p-6 sm:col-span-1 lg:col-span-1">
            <ReadinessGauge value={78} />
          </GlassCard>
          <MetricMini label="Sleep" value="7.2 h" icon={Moon} tone="default" />
          <MetricMini label="Energy" value="8 / 10" icon={Zap} tone="success" />
          <MetricMini label="Soreness" value="4 / 10" icon={TrendingUp} tone="warn" />
          <GlassCard hoverLift className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Weight</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">80.2 kg</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">−0.4 vs last log</p>
          </GlassCard>
        </div>
      </section>

      {/* Section 2 */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s workout</h2>
        <GlassCard hoverLift className="relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="rounded-lg bg-primary/20 text-primary hover:bg-primary/25">Upper — strength</Badge>
              <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Push &amp; pull density</h3>
              <p className="mt-2 max-w-xl text-muted-foreground">
                ~52 min · Chest &amp; back focus · 6 exercises · RIR-guided loads
              </p>
            </div>
            <Link
              href="/workout/session"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 shrink-0 rounded-2xl px-8 text-base shadow-lg shadow-primary/25"
              )}
            >
              Start Workout
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* Section 3 */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Performance summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat label="Weekly adherence" value="86%" hint="on track" variant="good" />
          <SummaryStat label="Total volume" value="12.4k" hint="kg × reps" variant="neutral" />
          <SummaryStat label="PRs this week" value="2" hint="squat, row" variant="good" />
          <SummaryStat label="Avg RIR accuracy" value="±0.6" hint="vs planned" variant="warn" />
        </div>
      </section>

      {/* Section 4 */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progress</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard hoverLift className="p-5">
            <h3 className="font-semibold">Strength progression</h3>
            <p className="text-xs text-muted-foreground">Estimated trends (demo data)</p>
            <div className="mt-4 h-[220px] w-full">
              <StrengthProgressChart />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5">
            <h3 className="font-semibold">Body weight</h3>
            <p className="text-xs text-muted-foreground">7-day trend</p>
            <div className="mt-4 h-[200px] w-full">
              <BodyWeightChart />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5 lg:col-span-2">
            <h3 className="font-semibold">Volume by muscle group</h3>
            <p className="text-xs text-muted-foreground">This week</p>
            <div className="mt-4 h-[220px] max-w-xl">
              <VolumeByMuscleChart />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Section 5 */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Brain className="size-4" />
          Insights
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <InsightCard
            title="Squat strength"
            body="Your squat strength is improving week over week. Consider +2.5 kg next heavy day if form stays crisp."
            tone="good"
          />
          <InsightCard title="Recovery" body="Recovery is slightly low this week — prioritize sleep and deload accessories if fatigue persists." tone="warn" />
          <InsightCard
            title="Load prescription"
            body="RIR on compounds landed high — you have room to increase load next session while keeping 1–2 RIR."
            tone="neutral"
          />
        </div>
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
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
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
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </GlassCard>
  );
}

function InsightCard({ title, body, tone }: { title: string; body: string; tone: "good" | "warn" | "neutral" }) {
  const bar =
    tone === "good" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-primary";
  return (
    <GlassCard hoverLift className="p-5">
      <div className={`mb-3 h-1 w-10 rounded-full ${bar}`} />
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </GlassCard>
  );
}
