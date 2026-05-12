"use client";

import { useRef, useState, useTransition } from "react";
import { uploadPhoto } from "./actions";

// Multi-photo file input with mobile camera capture preference.
// Each file is resized client-side (max 1920px wide JPEG ~0.85
// quality) BEFORE upload. Phone snaps drop from ~6 MB to ~400 KB,
// which both fits the Server Action body limit comfortably and
// makes the upload feel near-instant on mobile data.

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

async function resizeImage(file: File): Promise<File> {
  // SVGs, GIFs, anything weird — just return as-is and let the
  // server's MAX_PHOTO_BYTES check catch oversized files.
  if (!file.type.startsWith("image/")) return file;

  let img: HTMLImageElement;
  const objectUrl = URL.createObjectURL(file);
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not load image"));
      i.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // Already small enough — skip the canvas roundtrip.
  if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
    return file;
  }

  const scale = Math.min(
    MAX_DIMENSION / img.width,
    MAX_DIMENSION / img.height,
  );
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // hugely unlikely; bail to raw upload
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  // Replace original filename's extension with .jpg.
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

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
      try {
        const resized = await resizeImage(files[i]);
        const fd = new FormData();
        fd.set("viewingId", viewingId);
        if (roomId) fd.set("roomId", roomId);
        fd.set("file", resized);
        const res = await uploadPhoto(fd);
        if ("error" in res) {
          setError(res.error);
          break;
        }
        setBusy({ done: i + 1, total: files.length });
      } catch (err) {
        // Any thrown error (network, server action 413, image decode)
        // surfaces here instead of hanging the UI at 0/N.
        setError((err as Error).message || "Upload failed.");
        break;
      }
    }

    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
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
