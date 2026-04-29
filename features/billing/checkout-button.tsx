"use client";

import { useState } from "react";
import type { PlanLookupKey } from "./plans";

type Variant = "primary" | "accent";

const VARIANT_CLASSES: Record<Variant, string> = {
  // Claret default. Per design tokens §5: btn-primary is the default.
  primary:
    "bg-bg-strong text-text-on-strong hover:opacity-90 active:opacity-80",
  // Brass — at most one per screen.
  accent:
    "bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed",
};

export function CheckoutButton({
  lookupKey,
  variant = "primary",
  className = "",
}: {
  lookupKey: PlanLookupKey;
  variant?: Variant;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lookupKey }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: { message?: string };
      };
      if (!res.ok || !data.url) {
        throw new Error(data?.error?.message ?? "Checkout failed");
      }
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={`h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
      >
        {loading ? "Redirecting…" : "Start 14-day trial"}
      </button>
      {error && <p className="text-fail-fg mt-2 text-sm">{error}</p>}
    </div>
  );
}
