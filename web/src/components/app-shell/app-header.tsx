"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, Play, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebarMobile } from "./app-sidebar-mobile";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Sheet>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "rounded-xl md:hidden"
            )}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-border/60 p-0">
            <AppSidebarMobile />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-border/60 bg-card/40 px-3 py-1.5 sm:flex">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Readiness</span>
            <Badge variant="secondary" className="rounded-lg font-mono tabular-nums text-muted-foreground">
              —
            </Badge>
          </div>

          <Button variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Notifications">
            <Bell className="size-[18px]" />
          </Button>

          <Link
            href="/workout/session"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden h-9 rounded-2xl sm:inline-flex"
            )}
          >
            <Play className="mr-1.5 size-3.5" />
            Start Workout
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-xl")}
            >
              <Avatar className="size-8 rounded-xl">
                <AvatarFallback className="rounded-xl bg-primary/20 text-xs font-semibold text-primary">AR</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl" onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => router.push("/login")}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
