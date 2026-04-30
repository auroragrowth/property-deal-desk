import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { savedFilters } from "@/lib/db/schema";
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

  const before = await db.query.savedFilters.findFirst({
    where: and(eq(savedFilters.id, id), eq(savedFilters.userId, userId)),
  });

  await db
    .delete(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, userId)));

  if (before) {
    await logAudit({
      actorUserId: userId,
      action: "delete",
      entity: "saved_filter",
      entityId: id,
      before: { name: before.name, filter: before.filterJson },
    });
  }

  return NextResponse.json({ ok: true });
}
