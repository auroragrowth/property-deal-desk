-- RLS policies for v1 dev (overrides brief Section 12 schedule of week 11).
--
-- Policies use auth.jwt() ->> 'sub' which Supabase populates from the JWT.
-- Once the Clerk -> Supabase JWT template is wired (Clerk emits a JWT with
-- sub = clerk user id), client-side queries via Supabase JS will be properly
-- scoped. Server-side Drizzle queries connect as the postgres user and
-- bypass RLS by design — RLS here is defence-in-depth for any future
-- Supabase-JS access path (storage, realtime, browser-side reads).
--
-- Tables NOT covered by this migration:
--   users         — not in the brief's RLS list; add a self-only policy if
--                   we ever expose users via supabase-js
--   stripe_events — system-only (webhook handler writes via service role)
--   audit_log no-update / no-delete RULES — separate concern, add later

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY subscriptions_owner ON subscriptions
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- saved_filters
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY saved_filters_owner ON saved_filters
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY watchlist_owner ON watchlist
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- assumption_profiles
ALTER TABLE assumption_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY assumption_profiles_owner ON assumption_profiles
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- criteria_profiles
ALTER TABLE criteria_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY criteria_profiles_owner ON criteria_profiles
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY deals_owner ON deals
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
--> statement-breakpoint

-- deal_results — owner via parent deal; SELECT + INSERT only.
-- Append-only is enforced at the app level (brief Section 02 principle 5);
-- the absence of UPDATE/DELETE policies adds RLS defence-in-depth for any
-- non-service-role write path.
ALTER TABLE deal_results ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY deal_results_owner_select ON deal_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_results.deal_id
        AND deals.user_id = auth.jwt() ->> 'sub'
    )
  );
--> statement-breakpoint
CREATE POLICY deal_results_owner_insert ON deal_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_results.deal_id
        AND deals.user_id = auth.jwt() ->> 'sub'
    )
  );
--> statement-breakpoint

-- properties — readable by any authenticated user (global feed).
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY properties_authed_read ON properties
  FOR SELECT
  USING (auth.jwt() ->> 'sub' IS NOT NULL);
--> statement-breakpoint

-- property_listings — readable by any authenticated user.
ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY property_listings_authed_read ON property_listings
  FOR SELECT
  USING (auth.jwt() ->> 'sub' IS NOT NULL);
--> statement-breakpoint

-- audit_log — admin role only.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );
