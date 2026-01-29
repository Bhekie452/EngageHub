-- =============================================================================
-- Supabase RLS + Profiles Fix (run in Supabase SQL Editor)
-- Fixes: 401 Unauthorized, 406 Not Acceptable, PGRST116 (no profile row)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES: RLS so authenticated users can read/update their own row
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert for own row (used by trigger; or if app creates profile)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 2. WORKSPACES: RLS so authenticated users can read their own workspaces
-- -----------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
CREATE POLICY "Users can view own workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);


-- -----------------------------------------------------------------------------
-- 2b. SOCIAL_ACCOUNTS: RLS so workspace owners can read/manage their connections
--     (Fixes "No social accounts connected" when accounts exist in DB)
-- -----------------------------------------------------------------------------
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage social accounts in their workspaces" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can view social accounts in their workspace" ON public.social_accounts;

CREATE POLICY "Users can view social accounts in their workspace"
  ON public.social_accounts FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage social accounts in their workspace"
  ON public.social_accounts FOR ALL
  TO authenticated
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );


-- -----------------------------------------------------------------------------
-- 3. ANALYTICS_EVENTS: RLS so workspace owners can insert/read
-- -----------------------------------------------------------------------------
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view analytics_events in their workspace" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert analytics_events in their workspace" ON public.analytics_events;

CREATE POLICY "Users can view analytics_events in their workspace"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert analytics_events in their workspace"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Fallback: allow any authenticated user to insert (if you want analytics before workspace exists)
-- Uncomment only if 406 persists and you accept less strict security:
-- DROP POLICY IF EXISTS "Users can insert analytics events" ON public.analytics_events;
-- CREATE POLICY "Users can insert analytics events"
--   ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 4. Backfill missing profile for user (fix PGRST116)
-- Pulls email/full_name from auth.users so NOT NULL on "email" is satisfied.
-- Replace the UUID with the user id that has no profile.
-- -----------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, theme_mode, primary_color, sidebar_color, currency, currency_symbol)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'light',
  '#2563EB',
  '#ffffff',
  'USD',
  '$'
FROM auth.users u
WHERE u.id = '677bf9de-7cad-44d6-87c5-5db41d543669'::uuid
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- If your profiles table has different required columns, add them to the SELECT
-- (e.g. updated_at, created_at) and adjust the INSERT column list.


-- -----------------------------------------------------------------------------
-- 5. Ensure new users get a profile and workspace (trigger on signup)
-- Skip if handle_new_user already exists and is triggered correctly.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency, currency_symbol, theme_mode, primary_color, sidebar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'USD',
    '$',
    'light',
    '#2563EB',
    '#ffffff'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Workspace'),
    regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'company_name', 'my-workspace')), '[^a-z0-9]', '-', 'g') || '-' || substring(NEW.id::text from 1 for 8),
    NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users (run once)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
