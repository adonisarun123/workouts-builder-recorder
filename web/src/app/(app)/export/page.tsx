"use client";

import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function ExportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Export</h1>
        <p className="mt-1 text-muted-foreground">Download your training data for spreadsheets or your coach.</p>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Filters</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Date range
            <div className="flex gap-2">
              <input
                type="date"
                defaultValue="2026-03-01"
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2"
              />
              <input
                type="date"
                defaultValue="2026-04-07"
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2"
              />
            </div>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Exercise
            <select className="flex h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2">
              <option>All exercises</option>
              <option>Back squat</option>
              <option>Bench press</option>
              <option>Deadlift</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">
            Program
            <select className="flex h-10 w-full rounded-2xl border border-border/80 bg-background/60 px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2">
              <option>All programs</option>
              <option>Hypertrophy Block A</option>
              <option>Strength Mesocycle</option>
            </select>
          </label>
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Export CSV", icon: FileText, variant: "default" as const },
          { label: "Export Excel", icon: FileSpreadsheet, variant: "secondary" as const },
          { label: "Export PDF", icon: FileDown, variant: "outline" as const },
        ].map((x, i) => (
          <motion.div key={x.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Button
              variant={x.variant}
              className="h-auto w-full flex-col gap-2 rounded-2xl py-6 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <x.icon className="size-6 opacity-90" />
              {x.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
