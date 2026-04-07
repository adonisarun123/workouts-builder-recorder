"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const strengthData = [
  { w: "W1", squat: 92, bench: 68, row: 55 },
  { w: "W2", squat: 95, bench: 70, row: 57 },
  { w: "W3", squat: 97, bench: 71, row: 58 },
  { w: "W4", squat: 100, bench: 72, row: 60 },
  { w: "W5", squat: 102, bench: 74, row: 62 },
  { w: "W6", squat: 105, bench: 75, row: 63 },
];

const weightTrend = [
  { d: "Mon", kg: 81.2 },
  { d: "Tue", kg: 81.0 },
  { d: "Wed", kg: 80.8 },
  { d: "Thu", kg: 80.9 },
  { d: "Fri", kg: 80.5 },
  { d: "Sat", kg: 80.4 },
  { d: "Sun", kg: 80.2 },
];

const volumeMuscle = [
  { m: "Legs", v: 42 },
  { m: "Back", v: 28 },
  { m: "Chest", v: 22 },
  { m: "Shoulders", v: 18 },
  { m: "Arms", v: 14 },
];

const scatterData = [
  { r: 62, perf: 78 },
  { r: 71, perf: 85 },
  { r: 58, perf: 72 },
  { r: 80, perf: 91 },
  { r: 55, perf: 68 },
  { r: 74, perf: 88 },
  { r: 66, perf: 81 },
];

const chartTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(15,18,24,0.92)",
    backdropFilter: "blur(8px)",
  },
  labelStyle: { color: "#94a3b8" },
};

export function StrengthProgressChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={strengthData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="sq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.15 195)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="oklch(0.7 0.15 195)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
        <XAxis dataKey="w" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...chartTooltip} />
        <Area type="monotone" dataKey="squat" stroke="oklch(0.7 0.15 195)" fill="url(#sq)" strokeWidth={2} name="Squat (est. 1RM)" />
        <Area type="monotone" dataKey="bench" stroke="oklch(0.65 0.2 145)" fill="transparent" strokeWidth={2} name="Bench" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BodyWeightChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={weightTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.75 0.12 145)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="oklch(0.75 0.12 145)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...chartTooltip} />
        <Area type="monotone" dataKey="kg" stroke="oklch(0.72 0.14 145)" fill="url(#bw)" strokeWidth={2} name="kg" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeByMuscleChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={volumeMuscle} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="m" width={72} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...chartTooltip} />
        <Bar dataKey="v" fill="oklch(0.68 0.16 250)" radius={[0, 8, 8, 0]} name="Volume index" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReadinessVsPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          type="number"
          dataKey="r"
          name="Readiness"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Readiness", position: "bottom", offset: -4, fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <YAxis
          type="number"
          dataKey="perf"
          name="Performance"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Session score", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <Tooltip {...chartTooltip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={scatterData} fill="oklch(0.72 0.18 280)" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
