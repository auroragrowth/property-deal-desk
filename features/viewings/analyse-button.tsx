"use client";

import { useState, useTransition } from "react";
import { analyseFromViewing } from "./analyse-action";

export function AnalyseFromViewingButton({
  viewingId,
}: {
  viewingId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await analyseFromViewing(viewingId);
      // analyseFromViewing redirects on success — only an explicit
      // `{ error }` shape ever comes back here.
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="bg-accent text-accent-on hover:bg-accent-hover inline-flex h-10 items-center rounded-md px-4 text-xs font-medium disabled:opacity-50"
      >
        {pending ? "Running…" : "Run the numbers"}
      </button>
      {error && (
        <p role="alert" className="text-fail-fg mt-2 max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
