"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Plus, Timer } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SetRow = { planned: string; weight: string; reps: string; rir: string; done: boolean };

type Exercise = {
  id: string;
  name: string;
  muscle: string;
  planned: string;
  weight: string;
  rir: string;
  restSec: number;
  cue: string;
  sets: SetRow[];
};

const initialExercises: Exercise[] = [
  {
    id: "1",
    name: "Barbell bench press",
    muscle: "Chest",
    planned: "4 × 6",
    weight: "72.5",
    rir: "2",
    restSec: 120,
    cue: "Touch chest, pause 1s, drive up with intent.",
    sets: [
      { planned: "6", weight: "72.5", reps: "6", rir: "2", done: false },
      { planned: "6", weight: "72.5", reps: "6", rir: "2", done: false },
      { planned: "6", weight: "72.5", reps: "6", rir: "2", done: false },
      { planned: "6", weight: "72.5", reps: "6", rir: "2", done: false },
    ],
  },
  {
    id: "2",
    name: "Chest-supported row",
    muscle: "Back",
    planned: "3 × 10",
    weight: "50",
    rir: "2",
    restSec: 90,
    cue: "Pull elbows back, squeeze mid-back.",
    sets: [
      { planned: "10", weight: "50", reps: "10", rir: "2", done: false },
      { planned: "10", weight: "50", reps: "10", rir: "2", done: false },
      { planned: "10", weight: "50", reps: "10", rir: "2", done: false },
    ],
  },
];

export function WorkoutSessionClient() {
  const [exercises, setExercises] = useState(initialExercises);
  const [activeIdx, setActiveIdx] = useState(0);
  const [sessionStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restOpen, setRestOpen] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [pain, setPain] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  useEffect(() => {
    if (!restOpen || restLeft <= 0) return;
    const t = setInterval(() => setRestLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [restOpen, restLeft]);

  const { totalSets, doneSets } = useMemo(() => {
    let t = 0;
    let d = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        t += 1;
        if (s.done) d += 1;
      });
    });
    return { totalSets: t, doneSets: d };
  }, [exercises]);

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const bumpWeight = useCallback((exId: string, si: number, delta: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const sets = ex.sets.map((row, i) => {
          if (i !== si) return row;
          const w = Math.max(0, Number(row.weight || 0) + delta);
          return { ...row, weight: String(w) };
        });
        return { ...ex, sets };
      })
    );
  }, []);

  const updateSet = useCallback((exId: string, si: number, field: keyof SetRow, value: string | boolean) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const sets = ex.sets.map((row, i) => (i === si ? { ...row, [field]: value } : row));
        return { ...ex, sets };
      })
    );
  }, []);

  const completeSet = useCallback(
    (ex: Exercise, si: number) => {
      updateSet(ex.id, si, "done", true);
      setRestLeft(ex.restSec);
      setRestOpen(true);
    },
    [updateSet]
  );

  const active = exercises[activeIdx];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28 md:pb-10">
      <div className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Session</p>
            <h1 className="text-lg font-bold md:text-xl">Push &amp; pull density</h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-sm tabular-nums">
            <span className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5">
              <Timer className="size-4 text-primary" />
              {fmtTime(elapsed)}
            </span>
          </div>
        </div>
        <Progress value={(doneSets / totalSets) * 100} className="mt-3 h-2 rounded-full" />
        <p className="mt-1 text-xs text-muted-foreground">
          {doneSets} / {totalSets} sets complete
        </p>
      </div>

      {/* Mobile swipe hint: tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={cn(
              "shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
              i === activeIdx ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
            )}
          >
            {i + 1}. {ex.name.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >
          <ExerciseCard
            exercise={active}
            bumpWeight={bumpWeight}
            updateSet={updateSet}
            completeSet={completeSet}
          />
        </motion.div>
      </AnimatePresence>

      <div className="hidden md:flex justify-between gap-4">
        <Button
          variant="outline"
          className="rounded-2xl"
          disabled={activeIdx === 0}
          onClick={() => setActiveIdx((i) => i - 1)}
        >
          Previous exercise
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
          disabled={activeIdx >= exercises.length - 1}
          onClick={() => setActiveIdx((i) => i + 1)}
        >
          Next exercise
        </Button>
      </div>

      <GlassCard className="space-y-4 p-6">
        <Label className="flex items-center gap-2">
          <Checkbox checked={pain} onCheckedChange={(c) => setPain(c === true)} />
          <span>Pain or discomfort today</span>
        </Label>
        <div>
          <Label htmlFor="sess-notes">Session notes</Label>
          <Textarea
            id="sess-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How it felt, technique cues…"
            className="mt-2 min-h-[88px] rounded-2xl border-border/80"
          />
        </div>
        <Link
          href="/workout/complete"
          className={cn(
            buttonVariants(),
            "flex h-12 w-full items-center justify-center rounded-2xl text-base shadow-lg shadow-primary/20 md:w-auto md:px-12"
          )}
        >
          Submit workout
        </Link>
      </GlassCard>

      <Dialog open={restOpen} onOpenChange={setRestOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-border/60">
          <DialogHeader>
            <DialogTitle>Rest</DialogTitle>
          </DialogHeader>
          <motion.div
            key={restLeft}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="py-6 text-center"
          >
            <p className="text-5xl font-bold tabular-nums tracking-tight">{restLeft}s</p>
            <p className="mt-2 text-sm text-muted-foreground">Breathe. Next set loading.</p>
          </motion.div>
          <Button variant="secondary" className="w-full rounded-2xl" onClick={() => setRestOpen(false)}>
            Skip rest
          </Button>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 md:hidden">
        <Button
          className="h-12 w-full rounded-2xl shadow-xl shadow-primary/30"
          onClick={() => {
            const ex = exercises[activeIdx];
            const next = ex.sets.findIndex((s) => !s.done);
            if (next >= 0) completeSet(ex, next);
            else if (activeIdx < exercises.length - 1) setActiveIdx((i) => i + 1);
          }}
        >
          <Check className="mr-2 size-4" />
          Complete set
        </Button>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  bumpWeight,
  updateSet,
  completeSet,
}: {
  exercise: Exercise;
  bumpWeight: (exId: string, si: number, delta: number) => void;
  updateSet: (exId: string, si: number, field: keyof SetRow, value: string | boolean) => void;
  completeSet: (ex: Exercise, si: number) => void;
}) {
  return (
    <GlassCard hoverLift className="overflow-hidden">
      <div className="border-b border-border/50 bg-muted/10 p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{exercise.muscle}</p>
        <h2 className="mt-1 text-xl font-bold md:text-2xl">{exercise.name}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PlanChip label="Plan" value={exercise.planned} />
          <PlanChip label="Target load" value={`${exercise.weight} kg`} />
          <PlanChip label="RIR" value={exercise.rir} />
          <PlanChip label="Rest" value={`${exercise.restSec}s`} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{exercise.cue}</p>
      </div>

      <div className="overflow-x-auto p-4 md:p-6">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pr-2">Set</th>
              <th className="pb-3 pr-2">Planned</th>
              <th className="pb-3 pr-2">Weight</th>
              <th className="pb-3 pr-2">Reps</th>
              <th className="pb-3 pr-2">RIR</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((row, si) => (
              <tr key={si} className="border-t border-border/40">
                <td className="py-3 pr-2 font-mono font-medium">{si + 1}</td>
                <td className="py-3 pr-2 text-muted-foreground">{row.planned} reps</td>
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-8 rounded-xl"
                      onClick={() => bumpWeight(exercise.id, si, -2.5)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Input
                      value={row.weight}
                      onChange={(e) => updateSet(exercise.id, si, "weight", e.target.value)}
                      className="h-9 w-20 rounded-xl text-center font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-8 rounded-xl"
                      onClick={() => bumpWeight(exercise.id, si, 2.5)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </td>
                <td className="py-3 pr-2">
                  <Input
                    value={row.reps}
                    onChange={(e) => updateSet(exercise.id, si, "reps", e.target.value)}
                    className="h-9 w-16 rounded-xl text-center font-mono"
                  />
                </td>
                <td className="py-3 pr-2">
                  <Input
                    value={row.rir}
                    onChange={(e) => updateSet(exercise.id, si, "rir", e.target.value)}
                    className="h-9 w-14 rounded-xl text-center font-mono"
                  />
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={row.done}
                      onClick={() => completeSet(exercise, si)}
                    >
                      <Check className="mr-1 size-3.5" />
                      Done
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground">
                      Skip
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function PlanChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
