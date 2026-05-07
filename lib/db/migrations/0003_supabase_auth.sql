-- Stage 2 of the Clerk → Supabase Auth swap.
--
-- Reshapes the schema so the user identity is `auth.users(id)` (uuid),
-- not the Clerk user id (text). Rewrites RLS to use `auth.uid()` and
-- adds a trigger that creates our public.users row on signup.
--
-- This migration is destructive on user-scoped data — by intent. The
-- new project has zero application rows; the only thing it removes
-- is the Clerk-era schema shape.

-- ─── Drop RLS policies that reference user_id ───────────────────────
DROP POLICY IF EXISTS subscriptions_owner ON subscriptions;
DROP POLICY IF EXISTS saved_filters_owner ON saved_filters;
DROP POLICY IF EXISTS watchlist_owner ON watchlist;
DROP POLICY IF EXISTS assumption_profiles_owner ON assumption_profiles;
DROP POLICY IF EXISTS criteria_profiles_owner ON criteria_profiles;
DROP POLICY IF EXISTS deals_owner ON deals;
DROP POLICY IF EXISTS deal_results_owner_select ON deal_results;
DROP POLICY IF EXISTS deal_results_owner_insert ON deal_results;
DROP POLICY IF EXISTS audit_log_admin_read ON audit_log;
--> statement-breakpoint

-- ─── Drop FKs referencing users.clerk_id ────────────────────────────
ALTER TABLE subscriptions       DROP CONSTRAINT IF EXISTS subscriptions_user_id_users_clerk_id_fk;
--> statement-breakpoint
ALTER TABLE saved_filters       DROP CONSTRAINT IF EXISTS saved_filters_user_id_users_clerk_id_fk;
--> statement-breakpoint
ALTER TABLE watchlist           DROP CONSTRAINT IF EXISTS watchlist_user_id_users_clerk_id_fk;
--> statement-breakpoint
ALTER TABLE assumption_profiles DROP CONSTRAINT IF EXISTS assumption_profiles_user_id_users_clerk_id_fk;
--> statement-breakpoint
ALTER TABLE criteria_profiles   DROP CONSTRAINT IF EXISTS criteria_profiles_user_id_users_clerk_id_fk;
--> statement-breakpoint
ALTER TABLE deals               DROP CONSTRAINT IF EXISTS deals_user_id_users_clerk_id_fk;
--> statement-breakpoint

-- ─── Wipe app rows so type changes are unambiguous ──────────────────
DELETE FROM deal_results;
--> statement-breakpoint
DELETE FROM deals;
--> statement-breakpoint
DELETE FROM assumption_profiles;
--> statement-breakpoint
DELETE FROM criteria_profiles;
--> statement-breakpoint
DELETE FROM watchlist;
--> statement-breakpoint
DELETE FROM saved_filters;
--> statement-breakpoint
DELETE FROM subscriptions;
--> statement-breakpoint
DELETE FROM users;
--> statement-breakpoint

-- ─── Reshape users: drop clerk_id, make id FK to auth.users ─────────
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;
--> statement-breakpoint
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE users ADD CONSTRAINT users_id_auth_users_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint

-- ─── Convert user_id columns from text → uuid ───────────────────────
ALTER TABLE subscriptions       ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE saved_filters       ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE watchlist           ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE assumption_profiles ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE criteria_profiles   ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE deals               ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE audit_log           ALTER COLUMN actor_user_id TYPE uuid USING NULL::uuid;
--> statement-breakpoint

-- ─── Re-add FKs against users.id ────────────────────────────────────
ALTER TABLE subscriptions       ADD CONSTRAINT subscriptions_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE saved_filters       ADD CONSTRAINT saved_filters_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE watchlist           ADD CONSTRAINT watchlist_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE assumption_profiles ADD CONSTRAINT assumption_profiles_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE criteria_profiles   ADD CONSTRAINT criteria_profiles_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE deals               ADD CONSTRAINT deals_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint

-- ─── Enable RLS on users + self-read policy ─────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (id = auth.uid());
--> statement-breakpoint
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
--> statement-breakpoint

-- ─── Recreate user-scoped RLS policies using auth.uid() ─────────────
CREATE POLICY subscriptions_owner ON subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY saved_filters_owner ON saved_filters
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY watchlist_owner ON watchlist
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY assumption_profiles_owner ON assumption_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY criteria_profiles_owner ON criteria_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY deals_owner ON deals
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint

CREATE POLICY deal_results_owner_select ON deal_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_results.deal_id
        AND deals.user_id = auth.uid()
    )
  );
--> statement-breakpoint
CREATE POLICY deal_results_owner_insert ON deal_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_results.deal_id
        AND deals.user_id = auth.uid()
    )
  );
--> statement-breakpoint

CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
--> statement-breakpoint

-- ─── Trigger: mirror auth.users → public.users on signup ────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
