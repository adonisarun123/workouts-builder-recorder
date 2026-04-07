import Link from "next/link";
import { Clock, Dumbbell, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WorkoutLandingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Today&apos;s workout</h1>
        <p className="mt-1 text-muted-foreground">Review the plan, then start the focused session view.</p>
      </div>

      <GlassCard hoverLift className="overflow-hidden p-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-lg">Strength</Badge>
          <Badge variant="secondary" className="rounded-lg">
            RIR-based
          </Badge>
        </div>
        <h2 className="mt-4 text-2xl font-bold">Push &amp; pull density</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
            <Clock className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold">~52 min</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
            <Target className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Focus</p>
              <p className="font-semibold">Chest &amp; back</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
            <Dumbbell className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Exercises</p>
              <p className="font-semibold">6</p>
            </div>
          </div>
        </div>
        <Link
          href="/workout/session"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex h-12 rounded-2xl px-10 shadow-lg shadow-primary/20")}
        >
          Start Workout
        </Link>
      </GlassCard>
    </div>
  );
}
