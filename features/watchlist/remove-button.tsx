"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Could not remove (HTTP ${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-text-secondary hover:text-fail-fg text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <p className="text-fail-fg text-[11px]">{error}</p>}
    </div>
  );
}
