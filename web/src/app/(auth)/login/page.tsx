"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { getApiBase } from "@/lib/api-base";
import { setAuthToken } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = new URL(window.location.href);
    const err = u.searchParams.get("error");
    const notice = u.searchParams.get("notice");
    if (err) setBanner({ type: "error", text: decodeURIComponent(err) });
    else if (notice) setBanner({ type: "info", text: decodeURIComponent(notice) });
    if (err || notice) window.history.replaceState({}, "", "/login");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const base = getApiBase();
    if (!base) {
      setError("API URL missing. Set NEXT_PUBLIC_API_URL to your WorkoutOS API (e.g. http://localhost:3000).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "PENDING_APPROVAL") {
          setError("Your account is still waiting for admin approval.");
        } else {
          setError(typeof data.error === "string" ? data.error : "Sign-in failed.");
        }
        return;
      }
      if (data.token) {
        setAuthToken(data.token);
        router.push("/dashboard");
        return;
      }
      setError("Unexpected response from server.");
    } catch {
      setError("Cannot reach the API. Is the server running and NEXT_PUBLIC_API_URL correct?");
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    const base = getApiBase();
    if (!base) {
      setError("API URL missing. Set NEXT_PUBLIC_API_URL so Google sign-in can reach the API.");
      return;
    }
    window.location.href = `${base}/api/auth/google/start`;
  }

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

            {banner ? (
              <p
                className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                  banner.type === "error"
                    ? "border border-destructive/30 bg-destructive/10 text-destructive"
                    : "border border-primary/25 bg-primary/10 text-primary"
                }`}
                role="status"
              >
                {banner.text}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-2xl border-border/80 bg-background/50 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    setBanner({
                      type: "info",
                      text: "Password reset is not wired yet. Ask your admin or use Google sign-in if enabled.",
                    })
                  }
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Signing in…" : "Log in"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl border-border/80 bg-background/30 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                onClick={continueWithGoogle}
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
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
