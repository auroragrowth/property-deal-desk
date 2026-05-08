import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. Used ONLY from trusted server code
// (server actions, route handlers) for operations that need to bypass
// RLS — e.g. uploading user-scoped photos to Storage where the storage
// policies are admin-managed.
//
// Never expose the resulting client to the browser. Never read this
// from a Client Component.

declare global {
  var __dealdesk_supabase_admin__: SupabaseClient | undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class SupabaseAdminMissingError extends Error {
  constructor() {
    super(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set " +
        "to use the admin client.",
    );
  }
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!url || !serviceKey) throw new SupabaseAdminMissingError();
  if (!globalThis.__dealdesk_supabase_admin__) {
    globalThis.__dealdesk_supabase_admin__ = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return globalThis.__dealdesk_supabase_admin__;
}

export const VIEWING_PHOTOS_BUCKET = "viewing-photos";
