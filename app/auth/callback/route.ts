import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Lands here after:
//   • email confirmation (signup),
//   • magic-link click,
//   • OAuth provider redirect.
// Exchanges the `code` query param for a session cookie, then bounces
// the user back to wherever they were headed (?next=…) or the dashboard.

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const dest = new URL("/sign-in", url.origin);
      dest.searchParams.set("error", error.message);
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
