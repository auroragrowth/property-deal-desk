"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: { message?: string } };
      if (!res.ok || !data.url) {
        throw new Error(data?.error?.message ?? "Portal session failed");
      }
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="border-border-strong text-text-primary hover:bg-bg-surface-2 h-11 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
      {error && <p className="text-fail-fg mt-2 text-sm">{error}</p>}
    </div>
  );
}
