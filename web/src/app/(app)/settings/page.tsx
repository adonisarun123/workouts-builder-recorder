"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Profile, goals, and how WorkoutOS nudges you.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="space-y-6 p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold">Profile</h2>
            <p className="text-xs text-muted-foreground">Shown on exports and shared summaries.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" defaultValue="Athlete" className="h-11 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="you@example.com" className="h-11 rounded-2xl" />
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div>
            <h2 className="text-sm font-semibold">Goals</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessions">Sessions / week</Label>
                <Input id="sessions" type="number" min={1} max={7} defaultValue={4} className="h-11 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Primary focus</Label>
                <select
                  id="target"
                  defaultValue="strength"
                  className="flex h-11 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2"
                >
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="recomp">Recomp</option>
                </select>
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div>
            <h2 className="text-sm font-semibold">Units</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUnits("imperial")}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  units === "imperial"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/80 bg-muted/30 hover:bg-muted/50"
                }`}
              >
                lb / in
              </button>
              <button
                type="button"
                onClick={() => setUnits("metric")}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  units === "metric"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/80 bg-muted/30 hover:bg-muted/50"
                }`}
              >
                kg / cm
              </button>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Appearance</h2>
              <p className="text-xs text-muted-foreground">Dark by default; switch anytime.</p>
            </div>
            <ThemeToggle />
          </div>

          <Separator className="bg-border/60" />

          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {[
              { id: "n1", label: "Workout reminders", desc: "Morning nudge on training days" },
              { id: "n2", label: "Recovery check-in", desc: "Quick readiness prompt" },
              { id: "n3", label: "Weekly digest", desc: "Volume, adherence, and insights" },
            ].map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch defaultChecked={n.id !== "n3"} />
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
