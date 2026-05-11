-- =============================================================================
-- 0002_classify_existing_projects.sql
-- =============================================================================
-- Purpose:
--   Back-fill `mode` values on rows that pre-date the `mode` column added by
--   0001_add_project_mode.sql.
--
--   The same heuristic is used by the client-side fallback in
--   src/data/project-fixtures.ts (getProjectMode), so the SQL classification
--   here mirrors what the UI would compute. Setting the value in the database
--   makes the classification permanent and removes any ambiguity.
--
-- Idempotent:
--   Only updates rows where `mode IS NULL`. Re-running is safe and a no-op
--   for rows already classified.
--
-- How to run:
--   psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_classify_existing_projects.sql
--   - or paste into the Supabase SQL Editor and click Run.
-- =============================================================================

BEGIN;

-- Thor / Asgard / Marvel signal words (case-insensitive). Mirrors
-- THOR_KEYWORDS in src/data/project-fixtures.ts. Order matters here only
-- relative to GEAR5 — Thor is checked first because its tokens are more
-- specific (named characters, weapons, realms).
WITH thor_pattern AS (
  SELECT '(?i)\m(thor|asgard|asgardian|mjolnir|mjölnir|bifrost|bifröst|stormbreaker|loki|yggdrasil|odin|valhalla|avengers?|marvel|mcu|midgard|jotunheim|ragnarok|ragnarök|heimdall|sif|frigga|hela|wakanda|shield|nine[ -]?realms?|norse|aesir|vanir|fenrir|valkyrie|rune|runic)\M'::text AS rx
),
-- Gear 5 / One Piece signal words. Mirrors GEAR5_KEYWORDS.
gear5_pattern AS (
  SELECT '(?i)\m(luffy|one[ -]?piece|straw[ -]?hat|strawhat|gear[ -]?5|nika|wano|mugiwara|pirate|devil[ -]?fruit|haki|zoro|nami|sanji|usopp|chopper|robin|franky|brook|jinbe|shanks|ace|sabo|oda|grand[ -]?line|yonko|shichibukai|poneglyph|den[ -]?den[ -]?mushi|berries|berry)\M'::text AS rx
)

UPDATE public.projects p
   SET mode = sub.computed_mode,
       updated_at = now()
  FROM (
    SELECT
      id,
      CASE
        WHEN COALESCE(slug, '')     ~ (SELECT rx FROM thor_pattern) THEN 'thor'
        WHEN COALESCE(title, '')    ~ (SELECT rx FROM thor_pattern) THEN 'thor'
        WHEN COALESCE(subtitle, '') ~ (SELECT rx FROM thor_pattern) THEN 'thor'
        WHEN COALESCE(summary, '')  ~ (SELECT rx FROM thor_pattern) THEN 'thor'
        WHEN COALESCE(slug, '')     ~ (SELECT rx FROM gear5_pattern) THEN 'gear5'
        WHEN COALESCE(title, '')    ~ (SELECT rx FROM gear5_pattern) THEN 'gear5'
        WHEN COALESCE(subtitle, '') ~ (SELECT rx FROM gear5_pattern) THEN 'gear5'
        WHEN COALESCE(summary, '')  ~ (SELECT rx FROM gear5_pattern) THEN 'gear5'
        ELSE NULL
      END AS computed_mode
      FROM public.projects
     WHERE mode IS NULL
  ) AS sub
 WHERE p.id = sub.id
   AND p.mode IS NULL
   AND sub.computed_mode IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Optional belt-and-braces explicit overrides for the canonical seed slugs.
-- These run AFTER the heuristic so a misclassification (e.g. an admin row
-- titled "Den Den Mushi Realtime" being filed under Thor by mistake) gets
-- corrected to the right mode.
-- ----------------------------------------------------------------------------

UPDATE public.projects SET mode = 'thor', updated_at = now()
 WHERE slug IN (
   'mjolnir-ui-kit',
   'mjolnir-ui-forge',
   'bifrost-analytics',
   'bifrost-pipeline',
   'stormbreaker-ci',
   'asgard-codex',
   'asgard-ecommerce',
   'lokis-mirror',
   'yggdrasil-atlas'
 );

UPDATE public.projects SET mode = 'gear5', updated_at = now()
 WHERE slug IN (
   'gear-5-design-system',
   'den-den-mushi-realtime',
   'wano-cms',
   'straw-hat-luffy',
   'straw-hat-zoro',
   'straw-hat-nami',
   'straw-hat-usopp',
   'straw-hat-sanji',
   'straw-hat-chopper',
   'straw-hat-robin',
   'straw-hat-franky',
   'straw-hat-brook',
   'straw-hat-jinbe'
 );

COMMIT;

-- =============================================================================
-- After running, verify with:
--   SELECT slug, mode FROM public.projects ORDER BY sort_order;
-- =============================================================================
