import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  customType,
  doublePrecision,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// PostGIS geography(point). Requires `CREATE EXTENSION postgis;` in the target DB.
const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(point)";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("user"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.clerkId),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const stripeEvents = pgTable("stripe_events", {
  stripeEventId: text("stripe_event_id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow(),
});

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    addressLine1: text("address_line_1").notNull(),
    postcode: text("postcode").notNull(),
    city: text("city"),
    county: text("county"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geom: geographyPoint("geom").generatedAlwaysAs(
      sql`(ST_MakePoint(longitude, latitude)::geography)`,
    ),
    propertyType: text("property_type"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    floorAreaM2: integer("floor_area_m2"),
    tenure: text("tenure"),
    epcRating: text("epc_rating"),
    listingPrice: integer("listing_price"),
    listingStatus: text("listing_status").default("active"),
    estimatedMonthlyRent: integer("estimated_monthly_rent"),
    estimatedGrossYield: numeric("estimated_gross_yield", {
      precision: 5,
      scale: 4,
    }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("properties_postcode_idx").on(t.postcode),
    index("properties_listing_price_idx").on(t.listingPrice),
    index("properties_bedrooms_idx").on(t.bedrooms),
    index("properties_status_price_idx").on(t.listingStatus, t.listingPrice),
    index("properties_geom_idx").using("gist", t.geom),
  ],
);

export const propertyListings = pgTable(
  "property_listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceListingId: text("source_listing_id"),
    sourceUrl: text("source_url"),
    listedPrice: integer("listed_price"),
    status: text("status"),
    rawPayload: jsonb("raw_payload"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("property_listings_source_listing_uq").on(
      t.source,
      t.sourceListingId,
    ),
  ],
);

export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId),
  name: text("name").notNull(),
  filterJson: jsonb("filter_json").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkId),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    note: text("note"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("watchlist_user_property_uq").on(t.userId, t.propertyId)],
);

export const assumptionProfiles = pgTable("assumption_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId),
  name: text("name").notNull().default("Default"),
  depositPct: numeric("deposit_pct", { precision: 5, scale: 4 }).default(
    "0.25",
  ),
  ratePct: numeric("rate_pct", { precision: 5, scale: 4 }).default("0.0549"),
  mgmtPct: numeric("mgmt_pct", { precision: 5, scale: 4 }).default("0.10"),
  voidPct: numeric("void_pct", { precision: 5, scale: 4 }).default("0.05"),
  refurb: integer("refurb").default(0),
  legalFees: integer("legal_fees").default(200000),
  rentPcmOverride: integer("rent_pcm_override"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const criteriaProfiles = pgTable("criteria_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId),
  name: text("name").notNull().default("Default"),
  minCashflow: integer("min_cashflow").default(20000),
  minRoi: numeric("min_roi", { precision: 5, scale: 4 }).default("0.08"),
  maxCashRequired: integer("max_cash_required").default(5000000),
});

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkId),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    strategy: text("strategy").default("btl"),
    assumptionProfileId: uuid("assumption_profile_id").references(
      () => assumptionProfiles.id,
    ),
    criteriaProfileId: uuid("criteria_profile_id").references(
      () => criteriaProfiles.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("deals_user_property_strategy_uq").on(
      t.userId,
      t.propertyId,
      t.strategy,
    ),
  ],
);

export const dealResults = pgTable(
  "deal_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    engineVersion: text("engine_version").notNull(),
    assumptionSnapshot: jsonb("assumption_snapshot").notNull(),
    outputs: jsonb("outputs").notNull(),
    pass: boolean("pass").notNull(),
    passReasons: text("pass_reasons").array().notNull(),
    failReasons: text("fail_reasons").array().notNull(),
    calculatedAt: timestamp("calculated_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  (t) => [
    index("deal_results_deal_calculated_idx").on(
      t.dealId,
      t.calculatedAt.desc(),
    ),
  ],
);

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  ip: inet("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
