import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/api/stripe/webhook",
  "/api/cron",
  "/api/_debug",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(req: NextRequest) {
  // AUTH_BYPASS short-circuits the gate — every route is reachable
  // without sign-in. Used for demo / preview deploys.
  if (process.env.AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  const { res, user } = await updateSession(req);

  if (!isPublic(req.nextUrl.pathname) && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
