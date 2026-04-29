"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyseButton({
  propertyId,
  variant = "primary",
}: {
  propertyId: string;
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const text = await res.text();
      let data: { dealId?: string; error?: { message?: string } } = {};
      try {
        data = JSON.parse(text);
      } catch {
        // leave empty
      }
      if (!res.ok || !data.dealId) {
        throw new Error(
          data.error?.message ?? text ?? `Analyse failed (HTTP ${res.status})`,
        );
      }
      router.push(`/deal/${data.dealId}`);
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  const klass =
    variant === "ghost"
      ? "border-border-strong text-text-primary bg-transparent"
      : "bg-bg-strong text-text-on-strong";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={`h-9 rounded-md px-3 text-xs font-medium disabled:opacity-50 ${klass}`}
      >
        {pending ? "Analysing…" : "Analyse →"}
      </button>
      {error && <p className="text-fail-fg text-[11px]">{error}</p>}
    </div>
  );
}
