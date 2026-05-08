"use client";

import { useRef, useState, useTransition } from "react";
import { uploadPhoto } from "./actions";

// Multi-photo file input with mobile camera capture preference.
// Uploads sequentially so the server stays responsive on weak signal.

export function PhotoUploader({
  viewingId,
  roomId,
}: {
  viewingId: string;
  roomId: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy({ done: 0, total: files.length });
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.set("viewingId", viewingId);
      if (roomId) fd.set("roomId", roomId);
      fd.set("file", files[i]);
      const res = await uploadPhoto(fd);
      if ("error" in res) {
        setError(res.error);
        break;
      }
      setBusy({ done: i + 1, total: files.length });
    }
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
    // Force a refresh so the new photos show.
    startTransition(() => {});
  }

  return (
    <div className="space-y-2">
      <label className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium">
        <span aria-hidden>📷</span>
        <span>Add photos</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.currentTarget.files)}
        />
      </label>
      {busy && (
        <p className="text-text-tertiary text-xs">
          Uploading {busy.done} / {busy.total}…
        </p>
      )}
      {error && (
        <p role="alert" className="text-fail-fg text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
