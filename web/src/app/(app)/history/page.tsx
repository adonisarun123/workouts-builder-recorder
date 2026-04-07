"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, List, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const entries = [
  { id: "1", date: "2026-04-06", name: "Lower A", pct: 94, duration: "58m", lifts: "Squat 275×5 · RDL 225×8" },
  { id: "2", date: "2026-04-05", name: "Upper Push", pct: 88, duration: "52m", lifts: "Bench 205×6 · OHP 115×8" },
  { id: "3", date: "2026-04-03", name: "Pull + arms", pct: 100, duration: "49m", lifts: "Pull-up +45×6 · Row 180×10" },
  { id: "4", date: "2026-04-01", name: "Lower B", pct: 76, duration: "61m", lifts: "Deadlift 365×3 · Leg press" },
  { id: "5", date: "2026-03-30", name: "Full body", pct: 91, duration: "55m", lifts: "Squat 270×5 · Bench 200×5" },
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function HistoryPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [range, setRange] = useState("30");
  const [type, setType] = useState("all");
  const [perf, setPerf] = useState("any");

  const byDate = useMemo(() => {
    const m: Record<string, (typeof entries)[0][]> = {};
    for (const e of entries) {
      m[e.date] = m[e.date] ? [...m[e.date], e] : [e];
    }
    return m;
  }, []);

  const firstDow = startOfMonth(cursor).getDay();
  const total = daysInMonth(cursor);
  type Cell = { key: string; empty: true } | { key: string; empty: false; dayNum: number; iso: string };
  const cells: Cell[] = Array.from({ length: firstDow + total }, (_, i) => {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > total) return { key: `e-${i}`, empty: true as const };
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return { key: iso, empty: false as const, dayNum, iso };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">History</h1>
        <p className="mt-1 text-muted-foreground">Every session, searchable and comparable.</p>
      </div>

      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Date range
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="flex h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm text-foreground outline-none ring-primary/30 focus-visible:ring-2"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Workout type
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm text-foreground outline-none ring-primary/30 focus-visible:ring-2"
              >
                <option value="all">All</option>
                <option value="lower">Lower</option>
                <option value="upper">Upper</option>
                <option value="full">Full body</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Performance
              <select
                value={perf}
                onChange={(e) => setPerf(e.target.value)}
                className="flex h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm text-foreground outline-none ring-primary/30 focus-visible:ring-2"
              >
                <option value="any">Any</option>
                <option value="pr">PRs</option>
                <option value="high">&gt; 90% completion</option>
              </select>
            </label>
          </div>
        </div>
      </GlassCard>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl bg-muted/40 p-1 sm:w-auto">
          <TabsTrigger value="calendar" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <CalendarDays className="size-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <List className="size-4" />
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                {cursor.toLocaleString("default", { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60"
                  onClick={() => setCursor(startOfMonth(new Date()))}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {cells.map((c) =>
                c.empty ? (
                  <div key={c.key} className="aspect-square rounded-xl bg-transparent" />
                ) : (
                  <motion.button
                    key={c.key}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs font-medium transition-colors",
                      byDate[c.iso]?.length
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <span>{c.dayNum}</span>
                    {byDate[c.iso]?.length ? <span className="mt-0.5 size-1.5 rounded-full bg-primary" /> : null}
                  </motion.button>
                )
              )}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard hoverLift className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{e.name}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-lg font-mono tabular-nums",
                        e.pct >= 90 && "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        e.pct < 80 && "border border-destructive/25 bg-destructive/10 text-destructive"
                      )}
                    >
                      {e.pct}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.date}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{e.lifts}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  {e.duration}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
