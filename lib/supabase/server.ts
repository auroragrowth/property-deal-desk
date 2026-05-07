import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client wired to Next.js request cookies.
// Use in Server Components, Route Handlers, and Server Actions.
//
// Reads the user's session from the cookie store and refreshes it when
// Supabase rotates the JWT. RLS is enforced on every query because the
// JWT is forwarded to PostgREST/Postgres.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const c of toSet) {
            cookieStore.set(c.name, c.value, c.options);
          }
        } catch {
          // setAll throws when called from a Server Component (read-only
          // cookie store). The middleware refreshes the cookies on the way
          // out, so swallowing here is correct for RSC reads.
        }
      },
    },
  });
}
