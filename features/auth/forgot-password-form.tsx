"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type AuthActionResult,
} from "./actions";

export function ForgotPasswordForm() {
  const [state, submit, pending] = useActionState<
    AuthActionResult | null,
    FormData
  >(requestPasswordReset, null);

  return (
    <form action={submit} className="space-y-3">
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
      {state && "error" in state && (
        <p className="text-fail-fg text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state && "ok" in state && state.message && (
        <p className="text-pass-fg text-sm" role="status">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-bg-strong text-text-on-strong h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
