"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUnits } from "@/hooks/use-units";
import { lengthUnitLabel, massUnitLabel } from "@/lib/units";

const STORAGE_KEY = "workoutos_body_metrics_v1";

type MetricKey = "weight" | "bodyFat" | "waist" | "hips" | "restingHr" | "hrv";

type BodySnapshot = {
  values: Record<MetricKey, string>;
  trends: Record<MetricKey, string>;
  coachNote: string;
};

const emptySnapshot = (): BodySnapshot => ({
  values: {
    weight: "",
    bodyFat: "",
    waist: "",
    hips: "",
    restingHr: "",
    hrv: "",
  },
  trends: {
    weight: "",
    bodyFat: "",
    waist: "",
    hips: "",
    restingHr: "",
    hrv: "",
  },
  coachNote: "",
});

function parseStored(raw: string | null): BodySnapshot {
  const base = emptySnapshot();
  if (!raw) return base;
  try {
    const p = JSON.parse(raw) as Partial<BodySnapshot>;
    if (p.values && typeof p.values === "object") {
      for (const k of Object.keys(base.values) as MetricKey[]) {
        if (typeof p.values[k] === "string") base.values[k] = p.values[k];
      }
    }
    if (p.trends && typeof p.trends === "object") {
      for (const k of Object.keys(base.trends) as MetricKey[]) {
        if (typeof p.trends[k] === "string") base.trends[k] = p.trends[k];
      }
    }
    if (typeof p.coachNote === "string") base.coachNote = p.coachNote;
  } catch {
    /* ignore */
  }
  return base;
}

export default function BodyPage() {
  const { units } = useUnits();
  const metrics = useMemo(() => {
    const mass = massUnitLabel(units);
    const len = lengthUnitLabel(units);
    return [
      { key: "weight" as MetricKey, label: "Weight", unit: mass, inputMode: "decimal" as const },
      { key: "bodyFat" as MetricKey, label: "Body fat", unit: "%", inputMode: "decimal" as const },
      { key: "waist" as MetricKey, label: "Waist", unit: len, inputMode: "decimal" as const },
      { key: "hips" as MetricKey, label: "Hips", unit: len, inputMode: "decimal" as const },
      { key: "restingHr" as MetricKey, label: "Resting HR", unit: "bpm", inputMode: "numeric" as const },
      { key: "hrv" as MetricKey, label: "HRV (avg)", unit: "ms", inputMode: "numeric" as const },
    ];
  }, [units]);

  const [data, setData] = useState<BodySnapshot>(emptySnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(parseStored(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, hydrated]);

  function setMetricValue(key: MetricKey, value: string) {
    setData((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  }

  function setMetricTrend(key: MetricKey, trend: string) {
    setData((d) => ({ ...d, trends: { ...d.trends, [key]: trend } }));
  }

  function clearAll() {
    setData(emptySnapshot());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Body metrics</h1>
          <p className="mt-1 text-muted-foreground">Trends matter more than single weigh-ins. Edits save in this browser.</p>
        </div>
        <Button type="button" variant="outline" className="h-10 shrink-0 rounded-2xl" onClick={clearAll}>
          Clear all
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m, i) => {
          const id = `body-${m.key}`;
          const trendId = `body-${m.key}-trend`;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard hoverLift className="p-5">
                <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </Label>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  <Input
                    id={id}
                    type="text"
                    inputMode={m.inputMode}
                    autoComplete="off"
                    value={data.values[m.key]}
                    onChange={(e) => setMetricValue(m.key, e.target.value)}
                    placeholder="—"
                    className="h-auto min-h-0 max-w-[12rem] border-0 bg-transparent px-0 py-0.5 text-3xl font-bold tabular-nums tracking-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
                  />
                  <span className="text-lg font-semibold text-muted-foreground">{m.unit}</span>
                </div>
                <div className="mt-3">
                  <Label htmlFor={trendId} className="sr-only">
                    {m.label} trend
                  </Label>
                  <Input
                    id={trendId}
                    type="text"
                    value={data.trends[m.key]}
                    onChange={(e) => setMetricTrend(m.key, e.target.value)}
                    placeholder="Trend vs last log (optional)"
                    className="h-9 rounded-xl border-border/60 bg-muted/20 text-xs"
                  />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <GlassCard className="p-5">
        <Label htmlFor="coach-note" className="text-sm font-semibold">
          Coach note
        </Label>
        <Textarea
          id="coach-note"
          value={data.coachNote}
          onChange={(e) => setData((d) => ({ ...d, coachNote: e.target.value }))}
          placeholder="Private notes or cues from your coach (optional)."
          className="mt-3 min-h-[100px] rounded-2xl border-border/60 bg-background/40"
        />
      </GlassCard>
    </div>
  );
}
