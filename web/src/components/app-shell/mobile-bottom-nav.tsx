"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, Home, History, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workout", label: "Plan", icon: Dumbbell },
  { href: "/workout/session", label: "Go", icon: Play, accent: true },
  { href: "/history", label: "Log", icon: History },
  { href: "/analytics", label: "Data", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active =
            t.href === "/workout/session"
              ? pathname.startsWith("/workout/session")
              : pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href));
          if (t.accent) {
            return (
              <Link
                key={t.href}
                href={t.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
                  <Icon className="size-5" />
                </span>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
