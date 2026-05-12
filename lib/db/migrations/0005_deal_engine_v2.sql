-- BTL engine v2 — Mastering The Numbers.
--
-- Adds the fields the new engine needs (insurance, maintenance,
-- auction + sourcing fees, GDV) and tightens the canonical default
-- mortgage rate from 5.49% to 5.00% (per the PDF Expenses slide).

ALTER TABLE "assumption_profiles"
  ADD COLUMN IF NOT EXISTS "maintenance_pct" numeric(5, 4) DEFAULT '0.05';
--> statement-breakpoint
ALTER TABLE "assumption_profiles"
  ADD COLUMN IF NOT EXISTS "insurance_pcm" integer DEFAULT 2000;
--> statement-breakpoint
ALTER TABLE "assumption_profiles"
  ADD COLUMN IF NOT EXISTS "auction_fee" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "assumption_profiles"
  ADD COLUMN IF NOT EXISTS "sourcing_fee" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "assumption_profiles"
  ADD COLUMN IF NOT EXISTS "gdv_pence" integer;
--> statement-breakpoint
ALTER TABLE "assumption_profiles"
  ALTER COLUMN "rate_pct" SET DEFAULT '0.05';
