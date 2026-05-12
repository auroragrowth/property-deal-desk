-- Lets the Comparables panel filter PropertyData /rents and
-- /sold-prices by bedrooms — much more accurate than the area-wide
-- average we were rendering before.

ALTER TABLE "viewings"
  ADD COLUMN IF NOT EXISTS "property_bedrooms" integer;
