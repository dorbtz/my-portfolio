-- =============================================================================
-- 0005_site_content.sql
-- =============================================================================
-- Purpose:
--   Owner-editable site copy. Backs an admin CMS that lets the portfolio owner
--   edit Hero / About / Skills / Projects / Contact text without redeploying.
--
--   Each row stores a single field of copy keyed by (section, mode, field):
--     - section : which page section the copy belongs to
--                 ('hero' | 'about' | 'skills' | 'projects' | 'contact')
--     - mode    : 'thor' | 'gear5' for per-mode copy, OR NULL for unified copy
--                 that is shared across both modes (e.g. Skills domains)
--     - field   : the specific field name within the section,
--                 e.g. 'paragraph' / 'rotatingTitles' / 'cta1Label'
--     - value   : JSONB — string | string[] | structured object
--
--   The unique key (section, mode, field) makes upserts trivial and prevents
--   duplicates. Public SELECT is open (the copy is visible on the site
--   anyway); writes are gated by the existing is_admin() helper installed in
--   migration 0003_admin_allowlist.sql.
--
-- How to run:
--   Option A — Supabase SQL editor:
--     Open https://app.supabase.com → SQL Editor, paste this file, click Run.
--
--   Option B — psql CLI:
--     psql "$SUPABASE_DB_URL" -f supabase/migrations/0005_site_content.sql
--
-- After applying this, also apply 0006_seed_site_content.sql to seed the
-- initial copy from the hardcoded constants in the codebase.
--
-- Compatibility: PostgreSQL 15+ (Supabase default).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. site_content table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section     TEXT NOT NULL CHECK (section IN ('hero', 'about', 'skills', 'projects', 'contact')),
  -- mode is NULL for unified-across-modes content (e.g. Skills tree data).
  -- For per-mode copy, it is 'thor' or 'gear5'.
  mode        TEXT CHECK (mode IS NULL OR mode IN ('thor', 'gear5')),
  field       TEXT NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Composite unique key. Because Postgres treats NULL as distinct in UNIQUE
  -- by default, two rows with mode IS NULL but the same (section, field)
  -- would technically be allowed. We block that with a partial unique index
  -- below in addition to the regular composite UNIQUE.
  CONSTRAINT site_content_section_mode_field_uq
    UNIQUE (section, mode, field)
);

-- Partial unique index covering the (mode IS NULL) case so we cannot have two
-- "unified" rows for the same (section, field).
CREATE UNIQUE INDEX IF NOT EXISTS site_content_section_field_unified_uq
  ON public.site_content (section, field)
  WHERE mode IS NULL;

-- ---------------------------------------------------------------------------
-- 2. updated_at auto-touch trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_site_content_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_content_touch_updated_at ON public.site_content;
CREATE TRIGGER site_content_touch_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_site_content_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--   - Public can read all rows (the copy is public on the live site anyway).
--   - Only allowlisted admins can INSERT / UPDATE / DELETE.
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_content_public_read   ON public.site_content;
DROP POLICY IF EXISTS site_content_admin_insert  ON public.site_content;
DROP POLICY IF EXISTS site_content_admin_update  ON public.site_content;
DROP POLICY IF EXISTS site_content_admin_delete  ON public.site_content;

CREATE POLICY site_content_public_read
  ON public.site_content
  FOR SELECT
  USING (true);

CREATE POLICY site_content_admin_insert
  ON public.site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY site_content_admin_update
  ON public.site_content
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY site_content_admin_delete
  ON public.site_content
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;

-- =============================================================================
-- Verification (read-only):
--   SELECT COUNT(*) FROM public.site_content;
--   SELECT polname, polcmd FROM pg_policy
--     WHERE polrelid = 'public.site_content'::regclass;
-- =============================================================================
