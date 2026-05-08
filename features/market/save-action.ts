"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getUserIdOrNull } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { watchlist } from "@/lib/db/schema";
import { upsertProperty } from "@/features/properties/upsert";
import {
  toNormalised,
  type PropertyDataItem,
} from "@/features/properties/adapters/propertydata";
import { getEntitlements } from "@/lib/entitlements";
import { watchlistCount } from "@/features/watchlist/queries";
import { emit } from "@/lib/events";
import { logAudit } from "@/lib/audit";
import { track } from "@/lib/analytics/server";

export type SaveResult =
  | { ok: true }
  | { error: string };

// Save a PropertyData search hit to the user's watchlist:
//   1. upsert the property into our DB (so a stable id exists),
//   2. add the watchlist row (idempotent on user_id+property_id),
//   3. fire the same audit/analytics events that the manual paste flow does.

export async function saveSearchHit(
  raw: PropertyDataItem,
): Promise<SaveResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Sign in to save properties." };

  const ent = await getEntitlements(userId);
  const current = await watchlistCount(userId);
  if (current >= ent.maxWatchlistItems) {
    return {
      error: `Watchlist limit reached (${ent.maxWatchlistItems} on ${ent.plan}). Upgrade for more.`,
    };
  }

  const property = await upsertProperty(toNormalised(raw));

  const [item] = await db
    .insert(watchlist)
    .values({ userId, propertyId: property.id })
    .onConflictDoNothing({
      target: [watchlist.userId, watchlist.propertyId],
    })
    .returning();

  // If the conflict path fired, the property is already on the user's list —
  // treat as success.
  const existing = item
    ? null
    : await db.query.watchlist.findFirst({
        where: and(
          eq(watchlist.userId, userId),
          eq(watchlist.propertyId, property.id),
        ),
      });

  const row = item ?? existing;
  if (item) {
    await emit("watchlist.added", { userId, propertyId: property.id });
    await logAudit({
      actorUserId: userId,
      action: "create",
      entity: "watchlist",
      entityId: item.id,
      after: { propertyId: property.id, source: "market" },
    });
    await track(userId, "watchlist_added", {
      propertyId: property.id,
      source: "market",
    });
  }

  if (!row) return { error: "Could not save — please try again." };

  revalidatePath("/watchlist");
  return { ok: true };
}
