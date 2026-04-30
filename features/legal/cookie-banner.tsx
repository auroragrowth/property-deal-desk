"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dd_cookie_consent_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function dismiss(value: "accept" | "reject") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="border-border bg-bg-surface text-text-primary fixed inset-x-3 bottom-3 z-50 max-w-2xl rounded-lg border-[0.5px] p-4 shadow-lg sm:inset-x-auto sm:left-3"
    >
      <p className="text-sm">
        We use cookies for sign-in and product analytics (PostHog, EU). See our{" "}
        <Link
          href="/privacy"
          className="text-text-accent underline underline-offset-2"
        >
          privacy policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => dismiss("accept")}
          className="bg-bg-strong text-text-on-strong h-11 rounded-md px-4 text-sm font-medium"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => dismiss("reject")}
          className="border-border-strong text-text-primary hover:bg-bg-surface-2 h-11 rounded-md border-[0.5px] px-4 text-sm font-medium"
        >
          Reject non-essential
        </button>
      </div>
    </div>
  );
}
