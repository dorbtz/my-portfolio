/**
 * src/lib/projectDefaultCover.ts
 *
 * Returns a mode-appropriate fallback cover image when a Project row has no
 * `coverUrl` set (typical when Supabase rows are created via the admin UI
 * without an upload). Keeps the visual hierarchy intact instead of showing
 * the generic "No image" tile.
 *
 * Resolution order:
 *   1. If the project supplies a non-empty cover URL — use it as-is.
 *   2. Else if the slug matches a known seed cover under /seed/ — use that.
 *   3. Else if mode = 'thor' — use a Marvel/Mjolnir hero image.
 *   4. Else if mode = 'gear5' — use the One Piece logo as a dignified default.
 *   5. Else fall back to undefined so ImageFallback shows its built-in
 *      placeholder (mode-neutral case).
 */

import type { Project, ProjectMode } from '../types/project';

// ---------------------------------------------------------------------------
// Per-slug seed covers — covers shipped in /public/seed/.
// Includes both the new fixture slugs and the legacy SQL-seed slugs so
// existing Supabase rows render correctly even without manual uploads.
// ---------------------------------------------------------------------------
const SEED_COVER_BY_SLUG: Record<string, string> = {
  // New fixture slugs
  'mjolnir-ui-forge': '/seed/mjolnir-ui-kit.webp',
  'bifrost-pipeline': '/seed/bifrost-analytics.webp',
  'stormbreaker-ci': '/seed/mjolnir-ui-kit.webp',
  'asgard-codex': '/seed/bifrost-analytics.webp',
  'lokis-mirror': '/seed/asgard-ecommerce.webp',
  'yggdrasil-atlas': '/seed/wano-cms.webp',
  // Legacy SQL-seed slugs (supabase/seed/001_themed_projects.sql)
  'mjolnir-ui-kit': '/seed/mjolnir-ui-kit.webp',
  'bifrost-analytics': '/seed/bifrost-analytics.webp',
  'gear-5-design-system': '/seed/gear-5-design-system.webp',
  'den-den-mushi-realtime': '/seed/den-den-mushi-realtime.webp',
  'asgard-ecommerce': '/seed/asgard-ecommerce.webp',
  'wano-cms': '/seed/wano-cms.webp',
};

// ---------------------------------------------------------------------------
// Mode-specific fallbacks (when no per-slug seed cover exists).
// These always exist on disk so they never 404. ImageFallback's onError will
// still trip the placeholder if a path goes stale.
// ---------------------------------------------------------------------------
const THOR_DEFAULT_COVER = '/assets/Marvel/avengers-logo.png';   // Avengers wordmark — canonical Marvel hero badge
const GEAR5_DEFAULT_COVER = '/assets/One-Piece/One-Piece-Logo-1416.webp';

/**
 * Returns the cover URL to render for a project, including a mode-appropriate
 * fallback when the project's own `coverUrl` is missing or blank.
 */
export function resolveProjectCover(
  project: Pick<Project, 'coverUrl' | 'slug' | 'mode'>,
  mode: ProjectMode,
): string | undefined {
  // 1. Explicit cover URL on the row wins.
  const explicit = project.coverUrl?.trim();
  if (explicit) return explicit;

  // 2. Per-slug seed cover.
  const slug = project.slug?.trim();
  if (slug && SEED_COVER_BY_SLUG[slug]) return SEED_COVER_BY_SLUG[slug];

  // 3. Mode-specific fallback. Prefer the project's explicit `mode` field
  //    over the active UI mode so a Thor-mode card never shows a One Piece
  //    default in the rare cross-render case.
  const effectiveMode: ProjectMode = project.mode ?? mode;
  if (effectiveMode === 'thor') return THOR_DEFAULT_COVER;
  return GEAR5_DEFAULT_COVER;
}
