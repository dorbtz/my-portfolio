-- =============================================================================
-- 0003_admin_allowlist.sql
-- =============================================================================
-- Purpose:
--   Restrict admin write access (INSERT / UPDATE / DELETE on public.projects
--   and public.profiles) to a specific allowlist of email addresses, NOT just
--   any authenticated user. Even if a non-allowlisted user manages to obtain
--   a magic link they cannot mutate data.
--
-- Tables created:
--   - public.admin_emails: single-column allowlist of normalized emails.
--
-- Tables modified (RLS policies replaced):
--   - public.projects (INSERT, UPDATE, DELETE)
--   - public.profiles (INSERT, UPDATE)
--
-- How to run:
--   Option A — Supabase SQL editor:
--     Open https://app.supabase.com → SQL Editor, paste this file, click Run.
--
--   Option B — psql CLI:
--     psql "$SUPABASE_DB_URL" -f supabase/migrations/0003_admin_allowlist.sql
--
-- To add a new admin later, run in the SQL editor:
--   INSERT INTO public.admin_emails (email) VALUES ('new@example.com');
--
-- Compatibility: PostgreSQL 15+ (Supabase default).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. admin_emails table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY
);

-- Seed with the site owner's email. Idempotent: re-running is safe.
INSERT INTO public.admin_emails (email)
VALUES ('dbtzur@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. RLS on admin_emails — readable by anyone (so the client gate can check
--    membership before sending a magic link), but no public writes.
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_emails_select_all ON public.admin_emails;
CREATE POLICY admin_emails_select_all
  ON public.admin_emails
  FOR SELECT
  USING (true);

-- (No INSERT/UPDATE/DELETE policies → only the service role can mutate this
-- table. Admins must add new emails via the SQL editor.)

-- ---------------------------------------------------------------------------
-- 3. Helper: is_admin() — returns true if the current JWT email is allowlisted.
--     Uses lower() on both sides for case-insensitive comparison. Marked
--     STABLE so PG can cache the result within a single statement plan.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.admin_emails
     WHERE lower(email) = lower(coalesce(auth.email(), ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Replace projects RLS write policies with allowlist-aware versions.
--    NB: We drop a small set of common policy names — adapt if your local
--    project uses different names. The SELECT policy is preserved so the
--    public Projects page continues to work for anonymous visitors.
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_authenticated" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.projects;
DROP POLICY IF EXISTS projects_admin_insert ON public.projects;
DROP POLICY IF EXISTS projects_admin_update ON public.projects;
DROP POLICY IF EXISTS projects_admin_delete ON public.projects;

CREATE POLICY projects_admin_insert
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY projects_admin_update
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY projects_admin_delete
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Replace profiles RLS write policies with allowlist-aware versions.
--    Profiles are owner-scoped (each user's row keyed by their auth.uid()),
--    so the policy still scopes to the user's own row AND requires admin.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated update profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;

CREATE POLICY profiles_admin_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND id = auth.uid());

CREATE POLICY profiles_admin_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND id = auth.uid())
  WITH CHECK (public.is_admin() AND id = auth.uid());

COMMIT;

-- =============================================================================
-- Verification (read-only):
--   SELECT email FROM public.admin_emails;
--   SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.projects'::regclass;
--   SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.profiles'::regclass;
-- =============================================================================
