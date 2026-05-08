"use client";

import { useEffect, useRef, useState } from "react";

// Tracks `value`; calls `onSave(value)` after `delay` ms of no changes.
// Returns a "saving" / "saved" / "idle" status for tiny UI feedback.

export function useDebouncedSave<T>(
  value: T,
  initial: T,
  onSave: (v: T) => Promise<void>,
  delay = 700,
): "idle" | "saving" | "saved" {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const initialRef = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<T>(initial);

  useEffect(() => {
    if (Object.is(value, initialRef.current)) return;
    if (Object.is(value, lastSaved.current)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await onSave(value);
        lastSaved.current = value;
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, onSave, delay]);

  return status;
}
