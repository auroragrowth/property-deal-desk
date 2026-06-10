"use client";

import { useState } from "react";

export function ResetPasswordButton({ email }: { email: string | null }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = "Could not send reset email";
        try {
          msg =
            (JSON.parse(text) as { error?: { message?: string } })?.error
              ?.message ?? msg;
        } catch {
          // non-JSON body
        }
        throw new Error(msg);
      }
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-pass-fg text-sm">
        Reset link sent to <span className="font-mono">{email ?? "your email"}</span>.
        Check your inbox (and spam).
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="border-border-strong text-text-primary hover:bg-bg-surface-2 h-11 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send password-reset email"}
      </button>
      {error && <p className="text-fail-fg mt-2 text-sm">{error}</p>}
    </div>
  );
}
