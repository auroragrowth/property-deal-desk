import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { dealResults, deals, properties } from "@/lib/db/schema";
import { getEngine } from "./engines/_registry";
import {
  getOrCreateAssumptionProfile,
  getOrCreateCriteriaProfile,
  toAssumption,
  toCriteria,
} from "./profiles";
import type { EngineProperty } from "./engines/_interface";
import { emit } from "@/lib/events";

export async function analyseProperty(
  userId: string,
  propertyId: string,
  strategy: string = "btl",
) {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
  });
  if (!property) throw new Error("Property not found");
  if (!property.listingPrice || property.listingPrice <= 0) {
    throw new Error("Property has no price; cannot analyse");
  }

  const [assumptionRow, criteriaRow] = await Promise.all([
    getOrCreateAssumptionProfile(userId),
    getOrCreateCriteriaProfile(userId),
  ]);

  // Find or create the deal row.
  let deal = await db.query.deals.findFirst({
    where: and(
      eq(deals.userId, userId),
      eq(deals.propertyId, propertyId),
      eq(deals.strategy, strategy),
    ),
  });
  if (!deal) {
    [deal] = await db
      .insert(deals)
      .values({
        userId,
        propertyId,
        strategy,
        assumptionProfileId: assumptionRow.id,
        criteriaProfileId: criteriaRow.id,
      })
      .returning();
  }

  const engine = getEngine(strategy);
  const engineProperty: EngineProperty = {
    id: property.id,
    listing_price: property.listingPrice,
    estimated_monthly_rent: property.estimatedMonthlyRent ?? null,
    postcode: property.postcode,
    bedrooms: property.bedrooms ?? 0,
    property_type: property.propertyType ?? "other",
  };

  const assumptions = toAssumption(assumptionRow);
  const criteria = toCriteria(criteriaRow);

  const result = engine.run(engineProperty, assumptions, criteria);

  // Append-only deal_results (brief §02 principle 5).
  const [resultRow] = await db
    .insert(dealResults)
    .values({
      dealId: deal.id,
      engineVersion: result.engine_version,
      assumptionSnapshot: { assumptions, criteria, propertyId, strategy },
      outputs: result.outputs,
      pass: result.pass,
      passReasons: result.pass_reasons,
      failReasons: result.fail_reasons,
    })
    .returning();

  await emit("deal.analysed", { dealId: deal.id, pass: result.pass });

  return { deal, result: resultRow };
}
