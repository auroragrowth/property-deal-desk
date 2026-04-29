"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  filterToQueryString,
  type SavedFilter,
} from "./saved-filters";

export function SavedFilterChips({ items }: { items: SavedFilter[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const currentQs = searchParams.toString();

  if (items.length === 0) return null;

  async function remove(id: string) {
    setPendingId(id);
    try {
      await fetch(`/api/saved-filters/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-text-tertiary font-mono text-[11px] tracking-[0.12em] uppercase">
        Saved
      </span>
      {items.map((item) => {
        const qs = filterToQueryString(item.filter);
        const active = qs === currentQs;
        return (
          <span
            key={item.id}
            className={[
              "inline-flex h-11 items-center rounded-md border-[0.5px]",
              active
                ? "bg-bg-strong text-text-on-strong border-transparent"
                : "border-border-strong text-text-primary bg-transparent",
            ].join(" ")}
          >
            <Link
              href={qs ? `/dashboard?${qs}` : "/dashboard"}
              aria-current={active ? "page" : undefined}
              className="flex h-full items-center pl-4 text-xs font-medium"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={pendingId === item.id}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-md text-[10px] disabled:opacity-50",
                active ? "hover:bg-white/10" : "hover:bg-bg-surface-2",
              ].join(" ")}
              aria-label={`Delete saved filter ${item.name}`}
            >
              ✕
            </button>
          </span>
        );
      })}
    </div>
  );
}
