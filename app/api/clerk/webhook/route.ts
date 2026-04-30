import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { track } from "@/lib/analytics/server";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "config", message: "CLERK_WEBHOOK_SECRET not set" } },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: { code: "validation", message: "Missing svix headers" } },
      { status: 400 },
    );
  }

  const payload = await req.text();
  const wh = new Webhook(secret);
  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json(
      { error: { code: "validation", message: "Invalid signature" } },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;
      await db
        .insert(users)
        .values({
          clerkId: id,
          email,
          fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
          role: "user",
        })
        .onConflictDoNothing({ target: users.clerkId });
      await track(id, "signup", { email });
      break;
    }
    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses[0]?.email_address;
      await db
        .update(users)
        .set({
          ...(email ? { email } : {}),
          fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
        })
        .where(eq(users.clerkId, id));
      break;
    }
    case "user.deleted": {
      const id = event.data.id;
      if (id) {
        await db
          .update(users)
          .set({ deletedAt: new Date() })
          .where(eq(users.clerkId, id));
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
