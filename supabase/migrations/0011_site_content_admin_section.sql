-- =============================================================================
-- 0011_site_content_admin_section.sql
-- =============================================================================
-- Purpose:
--   Round 64 — Phase B of the hidden "D-B-T" admin-entry feature.
--   Extend the `site_content.section` CHECK constraint to allow a new
--   `'admin'` section that stores the per-mode secret-sequence + gap
--   configuration consumed by the header LogoBlock at runtime.
--
--   Idempotent: safe to run multiple times.
--
-- How to run:
--   Option A — Supabase MCP / SQL editor (paste this file).
--   Option B — Supabase CLI:
--     supabase db push
--
-- Depends on:
--   0005_site_content.sql  (created the `site_content` table and the
--                           original CHECK constraint we're replacing).
-- =============================================================================

BEGIN;

-- The original constraint was created inline as a column-level CHECK
-- with no explicit name, so PostgreSQL auto-named it
-- `site_content_section_check`.  Drop the existing one (if present) and
-- re-add a wider version that includes `'admin'`.
ALTER TABLE public.site_content
  DROP CONSTRAINT IF EXISTS site_content_section_check;

ALTER TABLE public.site_content
  ADD  CONSTRAINT site_content_section_check
  CHECK (section IN ('hero', 'about', 'skills', 'projects', 'contact', 'admin'));

COMMIT;

-- =============================================================================
-- Verification (read-only):
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.site_content'::regclass
--      AND conname  = 'site_content_section_check';
-- =============================================================================
