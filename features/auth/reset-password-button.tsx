"use client";

import { useEffect, useState } from "react";

const RESEND_AFTER_MS = 60_000;

export function ResetPasswordButton({ email }: { email: string | null }) {
  const [pending, setPending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Refresh the "Sent X seconds ago" string once a second after a send.
  useEffect(() => {
    if (sentAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sentAt]);

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
      setSentAt(Date.now());
      setNow(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (sentAt !== null) {
    const elapsedMs = now - sentAt;
    const canResend = elapsedMs >= RESEND_AFTER_MS;
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-pass-bg text-pass-fg border-pass-border rounded-r-md border-l-[3px] p-4"
      >
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase">
          Email sent
        </p>
        <p className="mt-1 text-sm">
          Reset link sent to{" "}
          <span className="font-mono">{email ?? "your email"}</span>.
        </p>
        <p className="text-pass-fg/80 mt-1 font-mono text-xs">
          {formatElapsed(elapsedMs)} · check inbox + spam · link expires in 60
          minutes
        </p>
        <div className="mt-3">
          {canResend ? (
            <button
              type="button"
              onClick={send}
              disabled={pending}
              className="border-pass-border text-pass-fg hover:bg-pass-bg/60 h-11 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Sending…" : "Resend email"}
            </button>
          ) : (
            <p className="text-pass-fg/70 text-xs">
              Didn&apos;t arrive? Resend in{" "}
              {Math.max(
                0,
                Math.ceil((RESEND_AFTER_MS - elapsedMs) / 1000),
              )}{" "}
              s.
            </p>
          )}
        </div>
        {error && <p className="text-fail-fg mt-2 text-sm">{error}</p>}
      </div>
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
      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="text-fail-fg mt-2 text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m} min ago`;
}
