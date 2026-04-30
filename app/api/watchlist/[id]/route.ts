import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { watchlist } from "@/lib/db/schema";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  const { id } = await params;

  const before = await db.query.watchlist.findFirst({
    where: and(eq(watchlist.id, id), eq(watchlist.userId, userId)),
  });

  await db
    .delete(watchlist)
    .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));

  if (before) {
    await logAudit({
      actorUserId: userId,
      action: "delete",
      entity: "watchlist",
      entityId: id,
      before: { propertyId: before.propertyId, note: before.note },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { note?: unknown };
  const note =
    typeof body.note === "string" ? body.note.slice(0, 280) : null;

  const before = await db.query.watchlist.findFirst({
    where: and(eq(watchlist.id, id), eq(watchlist.userId, userId)),
  });

  await db
    .update(watchlist)
    .set({ note })
    .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));

  if (before) {
    await logAudit({
      actorUserId: userId,
      action: "update",
      entity: "watchlist",
      entityId: id,
      before: { note: before.note },
      after: { note },
    });
  }

  return NextResponse.json({ ok: true });
}
