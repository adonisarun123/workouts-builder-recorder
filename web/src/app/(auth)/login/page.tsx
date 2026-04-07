"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex">
        <div className="login-hero-gradient absolute inset-0" />
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, oklch(0.55 0.2 200 / 0.5) 0%, transparent 45%), radial-gradient(circle at 80% 70%, oklch(0.5 0.18 165 / 0.45) 0%, transparent 40%)",
            backgroundSize: "200% 200%",
          }}
        />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg text-4xl font-bold leading-tight tracking-tight md:text-5xl"
          >
            Train Smarter. Track Better. Improve Faster.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="mt-4 max-w-md text-base text-white/80 md:text-lg"
          >
            Your personal strength, recovery &amp; performance system.
          </motion.p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="mb-8 w-full max-w-md lg:hidden">
          <h1 className="text-2xl font-bold tracking-tight">WorkoutOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Smart coaching, not just tracking.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 sm:p-10">
            <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your training.</p>

            <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex justify-end">
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="h-11 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                Log in
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl border-border/80 bg-background/30 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link href="#" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
