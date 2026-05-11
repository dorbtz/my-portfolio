-- =============================================================================
-- 0001_add_project_mode.sql
-- =============================================================================
-- Purpose:
--   Add an explicit `mode` column to the public.projects table so dual-mode
--   filtering ('thor' vs 'gear5') is data-driven instead of relying on a
--   keyword scan of title/subtitle/summary/tags.
--
-- Background:
--   Two production defects motivated this column:
--     1. A user-authored "Bifrost Pipeline" row was leaking into Luffy mode
--        because the keyword heuristic was thrown off by an ambiguous token.
--     2. Thor-themed rows displayed blank "No image" tiles because covers
--        were never uploaded; the explicit mode lets the client pick a
--        themed default cover with confidence.
--
-- Behaviour:
--   - Column type: TEXT with a CHECK constraint restricting values to
--     'thor', 'gear5', or NULL.
--   - NULL = mode-neutral (visible in BOTH modes). New rows can omit the
--     value safely; admins should set it explicitly when known.
--   - Idempotent: re-running this migration is a no-op.
--
-- How to run:
--   Option A — Supabase SQL editor:
--     Open https://app.supabase.com → SQL Editor, paste this file, click Run.
--
--   Option B — psql CLI:
--     psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_add_project_mode.sql
--
-- Compatibility: PostgreSQL 15+ (Supabase default).
-- =============================================================================

BEGIN;

-- 1. Add the column if it doesn't already exist.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS mode TEXT;

-- 2. Add the CHECK constraint guarding the allowed values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'projects_mode_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_mode_check
      CHECK (mode IS NULL OR mode IN ('thor', 'gear5'));
  END IF;
END $$;

-- 3. Add a partial index to speed up mode-filtered list queries (optional but
--    cheap — projects table is small and the dashboard hits it on every load).
CREATE INDEX IF NOT EXISTS projects_mode_idx
  ON public.projects (mode)
  WHERE mode IS NOT NULL;

COMMIT;

-- =============================================================================
-- After running this migration, run 0002_classify_existing_projects.sql to
-- back-fill mode values for any rows that pre-date the column.
-- =============================================================================
