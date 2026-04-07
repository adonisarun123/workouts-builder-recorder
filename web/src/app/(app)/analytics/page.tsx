"use client";

import { Fragment } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BodyWeightChart,
  ReadinessVsPerformanceChart,
  StrengthProgressChart,
  VolumeByMuscleChart,
} from "@/components/charts/dashboard-charts";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const groups = ["Legs", "Push", "Pull", "Core", "Arms"];
/** 0–1 intensity for demo heatmap */
const heat: number[][] = [
  [0.35, 0.55, 0.72, 0.5, 0.4, 0.25, 0.38],
  [0.45, 0.68, 0.82, 0.65, 0.55, 0.42, 0.48],
  [0.3, 0.52, 0.62, 0.78, 0.7, 0.5, 0.44],
  [0.22, 0.4, 0.55, 0.65, 0.58, 0.35, 0.3],
  [0.28, 0.48, 0.6, 0.52, 0.45, 0.32, 0.26],
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Depth when you want it — still readable at a glance.</p>
      </div>

      <Tabs defaultValue="strength" className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-muted/40 p-1">
          <TabsTrigger value="strength" className="rounded-xl data-[state=active]:shadow-sm">
            Strength
          </TabsTrigger>
          <TabsTrigger value="volume" className="rounded-xl data-[state=active]:shadow-sm">
            Volume
          </TabsTrigger>
          <TabsTrigger value="recovery" className="rounded-xl data-[state=active]:shadow-sm">
            Recovery
          </TabsTrigger>
          <TabsTrigger value="adherence" className="rounded-xl data-[state=active]:shadow-sm">
            Adherence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength" className="space-y-4">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Exercise progression</h2>
            <p className="text-xs text-muted-foreground">Demo series</p>
            <div className="mt-4 h-[240px]">
              <StrengthProgressChart />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Weekly volume</h2>
            <div className="mt-4 h-[240px]">
              <VolumeByMuscleChart />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Readiness vs performance</h2>
            <p className="text-xs text-muted-foreground">Scatter — each point is a session</p>
            <div className="mt-4 h-[240px]">
              <ReadinessVsPerformanceChart />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Body weight</h2>
            <div className="mt-4 h-[200px]">
              <BodyWeightChart />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Muscle group heatmap</h2>
            <p className="text-xs text-muted-foreground">Relative stimulus index (demo)</p>
            <div className="mt-6 overflow-x-auto">
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `88px repeat(${days.length}, minmax(2rem, 1fr))` }}
              >
                <div />
                {days.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {d}
                  </div>
                ))}
                {groups.map((g, ri) => (
                  <Fragment key={g}>
                    <div className="flex items-center text-xs font-medium">{g}</div>
                    {days.map((d, ci) => {
                      const v = heat[ri]?.[ci] ?? 0.35;
                      return (
                        <div
                          key={`${g}-${d}`}
                          className="aspect-square rounded-xl border border-primary/25 bg-primary transition-transform hover:scale-105"
                          style={{ opacity: 0.15 + v * 0.85 }}
                          title={`${g} · ${d}`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
