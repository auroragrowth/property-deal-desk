-- Viewings — mobile in-person capture flow.
-- One viewing → many rooms → many photos.
-- All RLS policies scope by viewings.user_id, with rooms + photos
-- inheriting via their viewing_id FK.

CREATE TABLE IF NOT EXISTS "viewings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "property_id" uuid,
  "property_url" text,
  "property_address" text,
  "property_postcode" text,
  "property_price_pence" integer,
  "overall_notes" text,
  "visited_at" timestamp WITH TIME ZONE DEFAULT now(),
  "created_at" timestamp WITH TIME ZONE DEFAULT now(),
  "updated_at" timestamp WITH TIME ZONE DEFAULT now(),
  CONSTRAINT "viewings_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "viewings_property_id_properties_id_fk"
    FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "viewings_user_visited_idx"
  ON "viewings" ("user_id", "visited_at" DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "viewing_rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "viewing_id" uuid NOT NULL,
  "name" text NOT NULL,
  "notes" text,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp WITH TIME ZONE DEFAULT now(),
  CONSTRAINT "viewing_rooms_viewing_id_viewings_id_fk"
    FOREIGN KEY ("viewing_id") REFERENCES "viewings"("id") ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "viewing_rooms_viewing_idx"
  ON "viewing_rooms" ("viewing_id", "position");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "viewing_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "viewing_id" uuid NOT NULL,
  "room_id" uuid,
  "storage_path" text NOT NULL,
  "caption" text,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp WITH TIME ZONE DEFAULT now(),
  CONSTRAINT "viewing_photos_viewing_id_viewings_id_fk"
    FOREIGN KEY ("viewing_id") REFERENCES "viewings"("id") ON DELETE CASCADE,
  CONSTRAINT "viewing_photos_room_id_viewing_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "viewing_rooms"("id") ON DELETE SET NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "viewing_photos_room_idx"
  ON "viewing_photos" ("room_id", "position");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "viewing_photos_viewing_idx"
  ON "viewing_photos" ("viewing_id", "position");
--> statement-breakpoint

-- ─── RLS policies ───────────────────────────────────────────────────
ALTER TABLE viewings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY viewings_owner ON viewings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint

ALTER TABLE viewing_rooms ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY viewing_rooms_owner ON viewing_rooms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM viewings
      WHERE viewings.id = viewing_rooms.viewing_id
        AND viewings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viewings
      WHERE viewings.id = viewing_rooms.viewing_id
        AND viewings.user_id = auth.uid()
    )
  );
--> statement-breakpoint

ALTER TABLE viewing_photos ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY viewing_photos_owner ON viewing_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM viewings
      WHERE viewings.id = viewing_photos.viewing_id
        AND viewings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viewings
      WHERE viewings.id = viewing_photos.viewing_id
        AND viewings.user_id = auth.uid()
    )
  );
