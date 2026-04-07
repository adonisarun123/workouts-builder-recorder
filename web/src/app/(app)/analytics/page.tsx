"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartEmptyPlaceholder } from "@/components/charts/dashboard-charts";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Depth when you want it — still readable at a glance.</p>
      </div>

      <Tabs defaultValue="strength" className="w-full space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/40 p-1 sm:w-fit">
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

        <TabsContent value="strength" className="mt-0 w-full space-y-4 focus-visible:outline-none">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Exercise progression</h2>
            <p className="text-xs text-muted-foreground">Lines appear when you log consistent sets over time.</p>
            <div className="mt-4 h-[240px] w-full">
              <ChartEmptyPlaceholder
                title="No progression data"
                subtitle="Complete workouts and log weights to chart strength trends (e.g. estimated load by week)."
                minHeight={240}
              />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="volume" className="mt-0 w-full space-y-4 focus-visible:outline-none">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Weekly volume</h2>
            <p className="text-xs text-muted-foreground">Volume by muscle group from your session history.</p>
            <div className="mt-4 h-[240px] w-full">
              <ChartEmptyPlaceholder
                title="No volume history"
                subtitle="Log sessions with exercises to see weekly volume bars."
                minHeight={240}
              />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="recovery" className="mt-0 w-full space-y-4 focus-visible:outline-none">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Readiness vs performance</h2>
            <p className="text-xs text-muted-foreground">Each point is a session once readiness and scores exist.</p>
            <div className="mt-4 h-[240px] w-full">
              <ChartEmptyPlaceholder
                title="No readiness data"
                subtitle="Log daily readiness and workouts to plot this scatter."
                minHeight={240}
              />
            </div>
          </GlassCard>
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Body weight</h2>
            <div className="mt-4 h-[200px] w-full">
              <ChartEmptyPlaceholder
                title="No weight trend"
                subtitle="Add weight entries under Body metrics to see a trend line."
                minHeight={200}
              />
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="adherence" className="mt-0 w-full space-y-4 focus-visible:outline-none">
          <GlassCard hoverLift className="p-5">
            <h2 className="font-semibold">Muscle group heatmap</h2>
            <p className="text-xs text-muted-foreground">Relative training stress by day once sessions are logged.</p>
            <div className="mt-4">
              <ChartEmptyPlaceholder
                title="No heatmap yet"
                subtitle="After several logged weeks, stimulus by muscle and day will appear here."
                minHeight={200}
              />
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
