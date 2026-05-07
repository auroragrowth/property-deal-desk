"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let initialized = false;

function ensureInit() {
  if (initialized || !KEY || typeof window === "undefined") return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureInit();
    if (!KEY) return;

    const supabase = getSupabaseBrowserClient();

    // Identify on initial load.
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) posthog.identify(user.id, { email: user.email });
    });

    // Track sign-in / sign-out within the SPA session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
