-- Captures the user's rent estimate during a viewing (often a number
-- the estate agent quotes on-site). Flows into the deal analyser
-- when they tap "Run the numbers".

ALTER TABLE "viewings"
  ADD COLUMN IF NOT EXISTS "property_rent_pcm_pence" integer;
