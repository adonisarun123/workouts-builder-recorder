"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Download,
  Dumbbell,
  LayoutDashboard,
  Ruler,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout", label: "Today's Workout", icon: Dumbbell },
  { href: "/programs", label: "Programs", icon: Activity },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/body", label: "Body Metrics", icon: Ruler },
  { href: "/export", label: "Export", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppSidebarMobile() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          WorkoutOS
        </Link>
        <p className="text-xs text-muted-foreground">Smart coaching</p>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 p-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <p className="p-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Coach mode</p>
    </div>
  );
}
