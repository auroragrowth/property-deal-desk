import { getUserIdOrNull } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { savedFilters } from "@/lib/db/schema";
import { listSavedFilters } from "@/features/properties/saved-filters-server";
import { sanitiseFilter } from "@/features/properties/saved-filters";
import { logAudit } from "@/lib/audit";
import { track } from "@/lib/analytics/server";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  const items = await listSavedFilters(userId);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdOrNull();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "auth", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      filter?: unknown;
    };
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    if (!name) {
      return NextResponse.json(
        { error: { code: "validation", message: "name required" } },
        { status: 400 },
      );
    }
    const filter = sanitiseFilter(body.filter);

    const [row] = await db
      .insert(savedFilters)
      .values({
        userId,
        name,
        filterJson: filter,
      })
      .returning();

    await logAudit({
      actorUserId: userId,
      action: "create",
      entity: "saved_filter",
      entityId: row.id,
      after: { name, filter },
    });
    await track(userId, "filter_saved", { name });

    return NextResponse.json({ id: row.id });
  } catch (err) {
    console.error("[saved-filters POST]", err);
    return NextResponse.json(
      {
        error: {
          code: "server",
          message: (err as Error).message ?? "Server error",
        },
      },
      { status: 500 },
    );
  }
}
