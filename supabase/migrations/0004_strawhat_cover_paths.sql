-- =============================================================================
-- 0004_strawhat_cover_paths.sql
-- =============================================================================
-- Purpose:
--   Update each Straw Hat crew project row's cover_url to the new high-quality
--   capitalized PNG wanted-poster assets that ship under
--   /public/assets/One-Piece/wanted/. Luffy keeps the legacy WebP because
--   the user did not provide a new Luffy.png.
--
-- How to run:
--   Option A — Supabase SQL editor: paste this file, click Run.
--   Option B — psql:
--     psql "$SUPABASE_DB_URL" -f supabase/migrations/0004_strawhat_cover_paths.sql
--
-- Compatibility: PostgreSQL 15+.
-- =============================================================================

BEGIN;

UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/luffy.webp'    WHERE slug = 'straw-hat-luffy';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Zoro.png'      WHERE slug = 'straw-hat-zoro';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Nami.png'      WHERE slug = 'straw-hat-nami';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Usopp.png'     WHERE slug = 'straw-hat-usopp';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Sanji.png'     WHERE slug = 'straw-hat-sanji';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Chopper.png'   WHERE slug = 'straw-hat-chopper';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Robin.png'     WHERE slug = 'straw-hat-robin';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Franky.png'    WHERE slug = 'straw-hat-franky';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Brook.png'     WHERE slug = 'straw-hat-brook';
UPDATE public.projects SET cover_url = '/assets/One-Piece/wanted/Jinbe.png'     WHERE slug = 'straw-hat-jinbe';

COMMIT;

-- Verification:
--   SELECT slug, mode, cover_url
--     FROM public.projects
--    WHERE mode = 'gear5'
--    ORDER BY sort_order;
