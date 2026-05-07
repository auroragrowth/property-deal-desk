"use client";

import { useActionState, useState } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
  type AuthActionResult,
} from "./actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const [tab, setTab] = useState<"password" | "magic">("password");
  const [oauthError, setOauthError] = useState<string | null>(null);

  const passwordAction = mode === "signin" ? signInWithPassword : signUpWithPassword;

  const [pwState, pwSubmit, pwPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(passwordAction, null);

  const [mlState, mlSubmit, mlPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signInWithMagicLink, null);

  async function googleSignIn() {
    setOauthError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setOauthError(error.message);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={googleSignIn}
        className="border-border-strong text-text-primary hover:bg-bg-surface-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            fill="#4285F4"
            d="M16.51 8.18a8.39 8.39 0 0 0-.13-1.5H9v2.84h4.21a3.6 3.6 0 0 1-1.56 2.36v1.96h2.52a7.6 7.6 0 0 0 2.34-5.66z"
          />
          <path
            fill="#34A853"
            d="M9 17a7.45 7.45 0 0 0 5.17-1.86l-2.52-1.96a4.7 4.7 0 0 1-7-2.46H2.05v1.99A7.99 7.99 0 0 0 9 17z"
          />
          <path
            fill="#FBBC05"
            d="M4.65 10.72a4.74 4.74 0 0 1 0-3.04V5.69H2.05a7.99 7.99 0 0 0 0 6.62l2.6-1.6z"
          />
          <path
            fill="#EA4335"
            d="M9 4.4a4.32 4.32 0 0 1 3.06 1.2l2.23-2.24A7.66 7.66 0 0 0 9 1a7.99 7.99 0 0 0-6.95 4.69l2.6 1.99A4.78 4.78 0 0 1 9 4.4z"
          />
        </svg>
        Continue with Google
      </button>
      {oauthError && (
        <p className="text-fail-fg text-sm" role="alert">
          {oauthError}
        </p>
      )}

      <div className="border-border flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-text-tertiary font-mono text-[10px] tracking-[0.18em] uppercase">
          or
        </span>
        <span className="bg-border h-px flex-1" />
      </div>

      <div role="tablist" aria-label="Email sign-in method" className="flex gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "password"}
          onClick={() => setTab("password")}
          className={[
            "h-11 flex-1 rounded-md px-3 text-sm font-medium",
            tab === "password"
              ? "bg-bg-surface-2 text-text-primary"
              : "text-text-tertiary hover:text-text-primary",
          ].join(" ")}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "magic"}
          onClick={() => setTab("magic")}
          className={[
            "h-11 flex-1 rounded-md px-3 text-sm font-medium",
            tab === "magic"
              ? "bg-bg-surface-2 text-text-primary"
              : "text-text-tertiary hover:text-text-primary",
          ].join(" ")}
        >
          Magic link
        </button>
      </div>

      {tab === "password" ? (
        <form action={pwSubmit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-text-secondary mb-1 block text-xs">
                Full name (optional)
              </span>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                className="border-border bg-bg-surface focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
              />
            </label>
          )}
          <label className="block">
            <span className="text-text-secondary mb-1 block text-xs">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="border-border bg-bg-surface focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-text-secondary mb-1 block text-xs">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="border-border bg-bg-surface focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
            />
          </label>
          {pwState && "error" in pwState && (
            <p className="text-fail-fg text-sm" role="alert">
              {pwState.error}
            </p>
          )}
          {pwState && "ok" in pwState && pwState.message && (
            <p className="text-pass-fg text-sm" role="status">
              {pwState.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pwPending}
            className="bg-bg-strong text-text-on-strong h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50"
          >
            {pwPending
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      ) : (
        <form action={mlSubmit} className="space-y-3">
          <label className="block">
            <span className="text-text-secondary mb-1 block text-xs">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="border-border bg-bg-surface focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
            />
          </label>
          {mlState && "error" in mlState && (
            <p className="text-fail-fg text-sm" role="alert">
              {mlState.error}
            </p>
          )}
          {mlState && "ok" in mlState && mlState.message && (
            <p className="text-pass-fg text-sm" role="status">
              {mlState.message}
            </p>
          )}
          <button
            type="submit"
            disabled={mlPending}
            className="bg-bg-strong text-text-on-strong h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50"
          >
            {mlPending ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}
    </div>
  );
}
