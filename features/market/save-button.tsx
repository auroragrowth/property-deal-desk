"use client";

import { useState } from "react";
import { saveSearchHit } from "./save-action";
import type { PropertyDataItem } from "@/features/properties/adapters/propertydata";

export function SaveButton({ item }: { item: PropertyDataItem }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setState("saving");
    setMsg(null);
    const res = await saveSearchHit(item);
    if ("error" in res) {
      setState("error");
      setMsg(res.error);
    } else {
      setState("saved");
    }
  }

  if (state === "saved") {
    return (
      <span className="text-pass-fg text-xs font-medium">Saved ✓</span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={state === "saving"}
        className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-9 items-center rounded-md border-[0.5px] bg-transparent px-3 text-xs font-medium disabled:opacity-50"
      >
        {state === "saving" ? "Saving…" : "Save to watchlist"}
      </button>
      {msg && (
        <p className="text-fail-fg mt-1 text-xs" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
