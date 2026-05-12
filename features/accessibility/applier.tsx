"use client";

import { useEffect } from "react";

// Reads accessibility preferences from localStorage and applies them
// to the <html> element via data attributes. CSS in globals.css scopes
// font-size + colour-contrast overrides on those attributes.
//
// Mounts once at the root layout so prefs apply on every page —
// marketing, authed, sign-in.

export const FONT_KEY = "dd_accessibility_font_v1";
export const CONTRAST_KEY = "dd_accessibility_contrast_v1";

export type FontPref = "default" | "large" | "xlarge";

function apply() {
  if (typeof document === "undefined") return;
  let font: FontPref = "default";
  let contrast = "default";
  try {
    const f = localStorage.getItem(FONT_KEY);
    if (f === "large" || f === "xlarge") font = f;
    if (localStorage.getItem(CONTRAST_KEY) === "high") contrast = "high";
  } catch {
    // private mode / cookies disabled — silently skip
  }
  document.documentElement.dataset.font = font;
  document.documentElement.dataset.contrast = contrast;
}

export function AccessibilityApplier() {
  useEffect(() => {
    apply();
    // Re-apply when another tab updates preferences.
    function onStorage(e: StorageEvent) {
      if (e.key === FONT_KEY || e.key === CONTRAST_KEY) apply();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
