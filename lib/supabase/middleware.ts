import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Middleware-side Supabase client.
//
// Refreshes the user's session cookie on every request and exposes the
// (possibly null) session to caller. The Next.js middleware uses this
// to gate authed routes — without the refresh, expired JWTs would log
// users out mid-session.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet) {
        for (const c of toSet) {
          req.cookies.set(c.name, c.value);
        }
        res = NextResponse.next({ request: req });
        for (const c of toSet) {
          res.cookies.set(c.name, c.value, c.options);
        }
      },
    },
  });

  // IMPORTANT: getUser() not getSession() — the latter trusts the cookie
  // payload without revalidating. getUser() round-trips to Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { res, user };
}
