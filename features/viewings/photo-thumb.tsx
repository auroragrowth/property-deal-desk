"use client";

import { useState } from "react";
import { deletePhoto } from "./actions";

export function PhotoThumb({
  viewingId,
  photoId,
  url,
  alt,
}: {
  viewingId: string;
  photoId: string;
  url: string;
  alt: string;
}) {
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  async function onDelete() {
    if (!confirm("Delete this photo?")) return;
    setBusy(true);
    const res = await deletePhoto(viewingId, photoId);
    if ("error" in res) {
      alert(res.error);
      setBusy(false);
    } else {
      setRemoved(true);
    }
  }

  return (
    <div className="border-border bg-bg-page relative overflow-hidden rounded-md border-[0.5px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label="Delete photo"
        className="bg-bg-strong/90 text-text-on-strong absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs leading-none disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}
