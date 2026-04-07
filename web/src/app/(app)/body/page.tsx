"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { label: "Weight", value: "182.4", unit: "lb", delta: "-0.6 wk" },
  { label: "Body fat", value: "14.2", unit: "%", delta: "-0.3 wk" },
  { label: "Waist", value: "32.0", unit: "in", delta: "stable" },
  { label: "Hips", value: "39.5", unit: "in", delta: "+0.2 wk" },
  { label: "Resting HR", value: "54", unit: "bpm", delta: "-2 wk" },
  { label: "HRV (avg)", value: "68", unit: "ms", delta: "+4 wk" },
];

export default function BodyPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Body metrics</h1>
        <p className="mt-1 text-muted-foreground">Trends matter more than single weigh-ins.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard hoverLift className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
                {m.value}
                <span className="ml-1 text-lg font-semibold text-muted-foreground">{m.unit}</span>
              </p>
              <Badge variant="secondary" className="mt-3 rounded-lg text-[10px] font-medium">
                {m.delta}
              </Badge>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-5">
        <h2 className="text-sm font-semibold">Coach note</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Weight is drifting down slightly while strength is up — good sign you are recomping. Keep protein consistent and
          avoid cutting volume during this block.
        </p>
      </GlassCard>
    </div>
  );
}
