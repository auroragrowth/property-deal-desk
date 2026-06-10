import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// Authed users hit this from /settings → triggers Supabase to email a
// password-reset link to the address on file. The link drops the user
// on /reset-password where they set a new password.

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.email) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${req.nextUrl.origin}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return NextResponse.json(
      { error: { code: "supabase", message: error.message } },
      { status: 500 },
    );
  }

  const sentAt = new Date().toISOString();

  await logAudit({
    actorUserId: user.id,
    action: "password_reset_requested",
    entity: "auth",
    entityId: user.id,
    after: { email: user.email, sentAt },
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
  });

  return NextResponse.json({ ok: true, email: user.email, sentAt });
}
