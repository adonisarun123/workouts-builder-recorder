"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WorkoutCompletePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24 text-center md:pb-10">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-4xl">🎉</div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Workout complete</h1>
        <p className="mt-2 text-muted-foreground">Strong session — data saved for your coach view.</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Completion" value="92%" variant="good" />
        <StatPill label="Duration" value="48m" variant="neutral" />
        <StatPill label="Volume" value="8.2k" variant="neutral" />
      </div>

      <GlassCard className="space-y-4 p-6 text-left">
        <h2 className="font-semibold">Session metrics</h2>
        <div className="grid gap-3 text-sm">
          <Row label="Total volume" value="8,240 kg·reps" />
          <Row label="Avg RIR vs planned" value="−0.4 (slightly harder)" />
          <Row label="Sets completed" value="14 / 15" />
        </div>
      </GlassCard>

      <div className="space-y-3 text-left">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Insights</h2>
        <InsightRow tone="good" text="Increase load next session on bench — RIR landed high on working sets." />
        <InsightRow tone="warn" text="Row pattern solid — maintain weight and chase one more rep." />
        <InsightRow tone="bad" text="You flagged discomfort — prioritize recovery before heavy lower work." />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-2xl")}>
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Link>
        <Link href="/analytics" className={cn(buttonVariants(), "h-11 rounded-2xl")}>
          <TrendingUp className="mr-2 size-4" />
          View analytics
        </Link>
      </div>
    </div>
  );
}

function StatPill({ label, value, variant }: { label: string; value: string; variant: "good" | "neutral" }) {
  return (
    <GlassCard
      className={cn(
        "p-3",
        variant === "good" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InsightRow({ tone, text }: { tone: "good" | "warn" | "bad"; text: string }) {
  const bar =
    tone === "good" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-red-500";
  return (
    <GlassCard className="flex gap-3 p-4">
      <div className={cn("mt-1 h-8 w-1 shrink-0 rounded-full", bar)} />
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </GlassCard>
  );
}
