import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { watchlist } from "@/lib/db/schema";
import { getEntitlements } from "@/lib/entitlements";
import {
  listWatchlist,
  watchlistCount,
} from "@/features/watchlist/queries";
import { emit } from "@/lib/events";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  const sortParam = req.nextUrl.searchParams.get("sort") ?? "added";
  const sort = (
    ["added", "priceAsc", "priceDesc", "postcode"].includes(sortParam)
      ? sortParam
      : "added"
  ) as "added" | "priceAsc" | "priceDesc" | "postcode";
  const items = await listWatchlist(userId, sort);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    propertyId?: unknown;
    note?: unknown;
  };
  const propertyId =
    typeof body.propertyId === "string" ? body.propertyId : "";
  const note =
    typeof body.note === "string" ? body.note.slice(0, 280) : null;
  if (!propertyId) {
    return NextResponse.json(
      { error: { code: "validation", message: "propertyId required" } },
      { status: 400 },
    );
  }

  // Plan limit (brief §08, principle 4)
  const ent = await getEntitlements(userId);
  const current = await watchlistCount(userId);
  if (current >= ent.maxWatchlistItems) {
    return NextResponse.json(
      {
        error: {
          code: "limit",
          message: `Watchlist limit reached (${ent.maxWatchlistItems} on ${ent.plan}). Upgrade for more.`,
        },
      },
      { status: 403 },
    );
  }

  const [item] = await db
    .insert(watchlist)
    .values({ userId, propertyId, note })
    .onConflictDoNothing({
      target: [watchlist.userId, watchlist.propertyId],
    })
    .returning();

  if (item) {
    await emit("watchlist.added", { userId, propertyId });
  } else {
    // Already on watchlist — return the existing row.
    const existing = await db.query.watchlist.findFirst({
      where: eq(watchlist.propertyId, propertyId),
    });
    return NextResponse.json({ item: existing ?? null });
  }

  return NextResponse.json({ item });
}
