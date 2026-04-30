"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

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
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    ensureInit();
  }, []);

  useEffect(() => {
    if (!KEY || !isLoaded) return;
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return <>{children}</>;
}
