"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  properties,
  viewings,
  watchlist,
} from "@/lib/db/schema";
import { analyseProperty } from "@/features/deals/analyse";
import { logAudit } from "@/lib/audit";
import { track } from "@/lib/analytics/server";

// "Run the numbers" from a viewing.
//
//  1. Ensure a property row exists (find by postcode + address, else
//     create one from the viewing's denormalised property fields).
//  2. Link the viewing to that property (so a re-run lands on the
//     same deal).
//  3. Idempotently add to the user's watchlist.
//  4. Run the BTL engine.
//  5. Redirect to /deal/[id].
//
// Fails fast if the viewing is missing the bits we need (address,
// postcode, asking price) — the user gets a clear nudge to fill them.

export async function analyseFromViewing(
  viewingId: string,
): Promise<{ error: string } | void> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Sign in to analyse a viewing." };

  const viewing = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!viewing) return { error: "Viewing not found." };

  if (
    !viewing.propertyAddress ||
    !viewing.propertyPostcode ||
    !viewing.propertyPricePence ||
    viewing.propertyPricePence <= 0
  ) {
    return {
      error:
        "Add the property address, postcode and asking price to the viewing first — the analyser needs them.",
    };
  }

  // 1. Find-or-create the property.
  let propertyId = viewing.propertyId;
  if (!propertyId) {
    const existing = await db.query.properties.findFirst({
      where: and(
        eq(properties.postcode, viewing.propertyPostcode),
        eq(properties.addressLine1, viewing.propertyAddress),
      ),
    });
    if (existing) {
      propertyId = existing.id;
    } else {
      const [inserted] = await db
        .insert(properties)
        .values({
          addressLine1: viewing.propertyAddress,
          postcode: viewing.propertyPostcode,
          listingPrice: viewing.propertyPricePence,
          listingStatus: "active",
        })
        .returning({ id: properties.id });
      propertyId = inserted.id;
    }

    // 2. Link the viewing to the property so future runs are idempotent.
    await db
      .update(viewings)
      .set({ propertyId, updatedAt: new Date() })
      .where(eq(viewings.id, viewingId));
  }

  // 3. Add to watchlist (idempotent).
  await db
    .insert(watchlist)
    .values({ userId, propertyId, note: "From viewing" })
    .onConflictDoNothing({
      target: [watchlist.userId, watchlist.propertyId],
    });

  // 4. Run the engine.
  const { deal, result } = await analyseProperty(userId, propertyId, {
    strategy: "btl",
  });

  await logAudit({
    actorUserId: userId,
    action: "create",
    entity: "deal_result",
    entityId: result.id,
    after: { dealId: deal.id, pass: result.pass, from: "viewing" },
  });
  await track(userId, "deal_analysed", {
    dealId: deal.id,
    pass: result.pass,
    from: "viewing",
  });

  // 5. Redirect to the analyser.
  redirect(`/deal/${deal.id}`);
}
