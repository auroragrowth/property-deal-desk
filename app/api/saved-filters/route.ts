import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { savedFilters } from "@/lib/db/schema";
import { listSavedFilters } from "@/features/properties/saved-filters-server";
import { sanitiseFilter } from "@/features/properties/saved-filters";
import { ensureLocalUser } from "@/lib/users/ensure-local";

export async function GET() {
  const { userId } = await auth();
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
    const { userId } = await auth();
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

    await ensureLocalUser(userId);

    const [row] = await db
      .insert(savedFilters)
      .values({
        userId,
        name,
        filterJson: filter,
      })
      .returning();

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
