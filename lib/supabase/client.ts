"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client. Singleton per page session.
// Use in Client Components for sign-in/up forms, sign-out, and any
// realtime subscriptions.

declare global {
  var __dealdesk_supabase__: SupabaseClient | undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!globalThis.__dealdesk_supabase__) {
    globalThis.__dealdesk_supabase__ = createBrowserClient(url, anon);
  }
  return globalThis.__dealdesk_supabase__;
}
