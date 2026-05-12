"use client";

import { useEffect, useState } from "react";
import {
  CONTRAST_KEY,
  FONT_KEY,
  type FontPref,
} from "./applier";

const FONT_OPTIONS: { value: FontPref; label: string; hint: string }[] = [
  { value: "default", label: "Default", hint: "16px base" },
  { value: "large", label: "Large", hint: "+12% / 18px base" },
  { value: "xlarge", label: "Extra large", hint: "+25% / 20px base" },
];

function applyToDom(font: FontPref, highContrast: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = font;
  document.documentElement.dataset.contrast = highContrast ? "high" : "default";
}

export function AccessibilitySettingsForm() {
  const [font, setFont] = useState<FontPref>("default");
  const [highContrast, setHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const f = localStorage.getItem(FONT_KEY);
      if (f === "large" || f === "xlarge") setFont(f);
      else setFont("default");
      setHighContrast(localStorage.getItem(CONTRAST_KEY) === "high");
    } catch {
      // ignore — sensible defaults already in state
    }
    setMounted(true);
  }, []);

  function pickFont(value: FontPref) {
    setFont(value);
    try {
      localStorage.setItem(FONT_KEY, value);
    } catch {
      // ignore
    }
    applyToDom(value, highContrast);
  }

  function toggleContrast(value: boolean) {
    setHighContrast(value);
    try {
      localStorage.setItem(CONTRAST_KEY, value ? "high" : "default");
    } catch {
      // ignore
    }
    applyToDom(font, value);
  }

  return (
    <section className="mb-10">
      <h2 className="text-text-secondary mb-3 text-xs font-medium tracking-wide uppercase">
        Accessibility
      </h2>
      <div className="border-border bg-bg-surface space-y-5 rounded-lg border-[0.5px] p-5">
        <fieldset className="space-y-2">
          <legend className="text-text-primary text-sm font-medium">
            Text size
          </legend>
          <p className="text-text-tertiary text-xs">
            Applies everywhere instantly. Saved to this device.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FONT_OPTIONS.map((opt) => {
              const active = mounted && font === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pickFont(opt.value)}
                  aria-pressed={active}
                  className={[
                    "rounded-md border-[0.5px] px-3 py-3 text-left text-sm",
                    active
                      ? "border-accent bg-bg-page text-text-primary"
                      : "border-border bg-transparent text-text-secondary hover:bg-bg-page",
                  ].join(" ")}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="text-text-tertiary mt-1 block text-xs">
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={mounted && highContrast}
            onChange={(e) => toggleContrast(e.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <span>
            <span className="text-text-primary block text-sm font-medium">
              High contrast
            </span>
            <span className="text-text-tertiary block text-xs">
              Darkens muted text and tightens borders for better legibility.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
