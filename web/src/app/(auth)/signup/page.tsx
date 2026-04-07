"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { getApiBase } from "@/lib/api-base";
import { setAuthToken } from "@/lib/auth-storage";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const base = getApiBase();
    if (!base) {
      setError("API URL missing. Set NEXT_PUBLIC_API_URL to your WorkoutOS API (e.g. http://localhost:3000).");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : data.detail || "Registration failed.");
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
        router.push("/dashboard");
        return;
      }

      if (data.pendingApproval) {
        router.push(`/login?notice=${encodeURIComponent(data.message || "Check your email — an admin must approve your account before you can sign in.")}`);
        return;
      }

      setError("Unexpected response from server.");
    } catch {
      setError("Cannot reach the API. Is the server running and CORS enabled?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex">
        <div className="login-hero-gradient absolute inset-0" />
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, oklch(0.55 0.2 200 / 0.5) 0%, transparent 45%), radial-gradient(circle at 80% 70%, oklch(0.5 0.18 165 / 0.45) 0%, transparent 40%)",
            backgroundSize: "200% 200%",
          }}
        />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight md:text-5xl">Start your training log.</h1>
          <p className="mt-4 max-w-md text-base text-white/80 md:text-lg">
            Create an account to sync plans, sessions, and coaching insights.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="mb-8 w-full max-w-md lg:hidden">
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join WorkoutOS in under a minute.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 sm:p-10">
            <h2 className="text-xl font-semibold tracking-tight">Sign up</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use the same API as the mobile / legacy app.</p>

            {error ? (
              <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
