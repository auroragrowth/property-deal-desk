"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WatchlistButton({
  propertyId,
  watchlistItemId,
}: {
  propertyId: string;
  watchlistItemId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onList = Boolean(watchlistItemId);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      if (onList && watchlistItemId) {
        const res = await fetch(`/api/watchlist/${watchlistItemId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error(await readErr(res, "Could not remove"));
        }
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
        if (!res.ok) {
          throw new Error(await readErr(res, "Could not save"));
        }
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function readErr(res: Response, fallback: string): Promise<string> {
    const text = await res.text().catch(() => "");
    if (!text) return `${fallback} (HTTP ${res.status})`;
    try {
      const data = JSON.parse(text) as { error?: { message?: string } };
      return data?.error?.message ?? fallback;
    } catch {
      return text.length < 200 ? text : `${fallback} (HTTP ${res.status})`;
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={onList}
        className={[
          "h-9 rounded-md border-[0.5px] px-3 text-xs font-medium disabled:opacity-50",
          onList
            ? "bg-pass-bg text-pass-fg border-pass-border"
            : "border-border-strong text-text-primary bg-transparent",
        ].join(" ")}
      >
        {pending ? "…" : onList ? "✓ Saved" : "+ Save"}
      </button>
      {error && <p className="text-fail-fg text-[11px]">{error}</p>}
    </div>
  );
}
