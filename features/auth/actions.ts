"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Server Actions for the three sign-in methods. Each returns a
// `{ error }` shape on failure; success either redirects (password
// sign-in/up) or returns `{ ok: true }` so the client can show "check
// your email" copy.

export type AuthActionResult =
  | { error: string }
  | { ok: true; message?: string };

async function siteUrl(): Promise<string> {
  // Use the request origin (works in dev + Vercel preview + prod)
  // — falls back to NEXT_PUBLIC_APP_URL if headers aren't available.
  const h = await headers();
  return (
    h.get("origin") ??
    h.get("referer") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export async function signInWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password required." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signUpWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  if (!email || !password) return { error: "Email and password required." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await getSupabaseServerClient();
  const origin = await siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding/plan`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is OFF in Supabase Auth settings, signUp
  // returns a session immediately and we can bounce straight in.
  if (data.session) redirect("/onboarding/plan");

  return {
    ok: true,
    message: "Check your inbox — click the link to confirm your email.",
  };
}

export async function signInWithMagicLink(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email required." };

  const supabase = await getSupabaseServerClient();
  const origin = await siteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };

  return {
    ok: true,
    message: "Magic link sent — check your inbox.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
