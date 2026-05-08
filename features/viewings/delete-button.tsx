"use client";

import { useTransition } from "react";
import { deleteViewing } from "./actions";

export function DeleteViewingButton({ viewingId }: { viewingId: string }) {
  const [pending, startTransition] = useTransition();

  function go() {
    if (!confirm("Delete this viewing and all its photos? This can't be undone."))
      return;
    startTransition(async () => {
      await deleteViewing(viewingId);
    });
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className="text-fail-fg inline-flex h-10 items-center text-xs underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete viewing"}
    </button>
  );
}
