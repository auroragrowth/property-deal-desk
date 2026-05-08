import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Replaces Clerk's `auth()` and `currentUser()` for server-side use.
//
// `getUser()` returns the Supabase auth user (or null). The shape kept
// minimal on purpose — call sites only ever needed `userId` and email.

export type AuthUser = {
  id: string; // uuid — matches users.id
  email: string | null;
  fullName: string | null;
};

// AUTH_BYPASS=true short-circuits auth entirely and returns a fixed
// demo user. Used to demo / preview the app without requiring sign-in.
// Writes that hit FK constraints to public.users will still fail
// because this uuid isn't in auth.users — read-only flows are the
// supported use case here.
const BYPASS_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "demo@dealdesk.local",
  fullName: "Demo",
};

export function authBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === "true";
}

export async function getUser(): Promise<AuthUser | null> {
  if (authBypassEnabled()) return BYPASS_USER;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      ([user.user_metadata?.first_name, user.user_metadata?.last_name]
        .filter(Boolean)
        .join(" ") || null),
  };
}

// Sugar for the common "userId or 401" pattern. Returns the uuid.
export async function getUserIdOrNull(): Promise<string | null> {
  const u = await getUser();
  return u?.id ?? null;
}
