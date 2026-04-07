"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Dumbbell } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const programs = [
  {
    id: "p1",
    name: "Hypertrophy Block A",
    weeks: 6,
    days: 4,
    focus: "Full body bias · legs",
    progress: 62,
  },
  {
    id: "p2",
    name: "Strength Mesocycle",
    weeks: 4,
    days: 3,
    focus: "Squat / bench / pull",
    progress: 28,
  },
  {
    id: "p3",
    name: "Deload + Skills",
    weeks: 2,
    days: 3,
    focus: "Recovery · technique",
    progress: 0,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Programs</h1>
        <p className="mt-1 text-muted-foreground">Structured blocks that adapt as you improve.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {programs.map((p) => (
          <motion.div key={p.id} variants={item}>
            <GlassCard hoverLift className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Dumbbell className="size-5" />
                </div>
                <Badge variant="secondary" className="rounded-lg font-mono text-[10px]">
                  {p.progress}%
                </Badge>
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.focus}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1">
                  <Calendar className="size-3.5" />
                  {p.weeks} wk
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1">
                  {p.days} sessions / wk
                </span>
              </div>
              <div className="mt-5 flex flex-1 items-end">
                <Link
                  href="/workout"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "group h-9 rounded-xl px-0 text-primary hover:bg-transparent"
                  )}
                >
                  Open plan
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
