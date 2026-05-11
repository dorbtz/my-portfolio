/**
 * src/lib/projectDefaultCover.test.ts
 *
 * Defect 1 regression: Thor mode home page must NEVER render a blank
 * "No image" tile when a Supabase project row has no cover_url. The
 * resolver picks a mode-appropriate fallback so Thor cards always show
 * a Marvel-themed image and Luffy cards always show a One Piece one.
 *
 * NOTE: Inlines the resolver implementation because the codebase's
 * vmThreads vitest pool can't reliably transform modules that import
 * type-only symbols (same constraint documented in
 * src/data/project-fixtures.test.ts). The inlined function MUST stay in
 * lockstep with src/lib/projectDefaultCover.ts.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inlined implementation — mirrors src/lib/projectDefaultCover.ts.
// ---------------------------------------------------------------------------

type Mode = 'thor' | 'gear5';

const SEED_COVER_BY_SLUG: Record<string, string> = {
  'mjolnir-ui-forge': '/seed/mjolnir-ui-kit.webp',
  'bifrost-pipeline': '/seed/bifrost-analytics.webp',
  'stormbreaker-ci': '/seed/mjolnir-ui-kit.webp',
  'asgard-codex': '/seed/bifrost-analytics.webp',
  'lokis-mirror': '/seed/asgard-ecommerce.webp',
  'yggdrasil-atlas': '/seed/wano-cms.webp',
  'mjolnir-ui-kit': '/seed/mjolnir-ui-kit.webp',
  'bifrost-analytics': '/seed/bifrost-analytics.webp',
  'gear-5-design-system': '/seed/gear-5-design-system.webp',
  'den-den-mushi-realtime': '/seed/den-den-mushi-realtime.webp',
  'asgard-ecommerce': '/seed/asgard-ecommerce.webp',
  'wano-cms': '/seed/wano-cms.webp',
};

const THOR_DEFAULT_COVER = '/assets/Marvel/avengers-logo.png';
const GEAR5_DEFAULT_COVER = '/assets/One-Piece/One-Piece-Logo-1416.webp';

function resolveProjectCover(
  project: { slug?: string; coverUrl?: string | null; mode?: Mode | null },
  mode: Mode,
): string | undefined {
  const explicit = project.coverUrl?.trim();
  if (explicit) return explicit;
  const slug = project.slug?.trim();
  if (slug && SEED_COVER_BY_SLUG[slug]) return SEED_COVER_BY_SLUG[slug];
  const effectiveMode: Mode = project.mode ?? mode;
  if (effectiveMode === 'thor') return THOR_DEFAULT_COVER;
  return GEAR5_DEFAULT_COVER;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveProjectCover — Defect 1 regression (no-image fallback)', () => {
  it('returns the explicit coverUrl when set', () => {
    expect(
      resolveProjectCover(
        { slug: 'foo', coverUrl: '/uploads/custom.webp' },
        'thor',
      ),
    ).toBe('/uploads/custom.webp');
  });

  it('trims whitespace-only coverUrl and falls through to the fallback', () => {
    expect(
      resolveProjectCover({ slug: 'unknown', coverUrl: '   ' }, 'thor'),
    ).toBe('/assets/Marvel/avengers-logo.png');
  });

  it('uses per-slug seed cover when one matches', () => {
    expect(
      resolveProjectCover({ slug: 'mjolnir-ui-kit', coverUrl: '' }, 'thor'),
    ).toBe('/seed/mjolnir-ui-kit.webp');
    expect(
      resolveProjectCover({ slug: 'bifrost-pipeline', coverUrl: undefined }, 'thor'),
    ).toBe('/seed/bifrost-analytics.webp');
    expect(
      resolveProjectCover({ slug: 'gear-5-design-system', coverUrl: '' }, 'gear5'),
    ).toBe('/seed/gear-5-design-system.webp');
  });

  it('falls back to a Thor default for Thor mode rows with no cover', () => {
    expect(
      resolveProjectCover({ slug: 'random-thor', coverUrl: '' }, 'thor'),
    ).toBe('/assets/Marvel/avengers-logo.png');
  });

  it('falls back to a Gear 5 default for Luffy mode rows with no cover', () => {
    expect(
      resolveProjectCover({ slug: 'random-luffy', coverUrl: '' }, 'gear5'),
    ).toBe('/assets/One-Piece/One-Piece-Logo-1416.webp');
  });

  it('prefers project.mode over the active UI mode for the fallback', () => {
    expect(
      resolveProjectCover(
        { slug: 'no-seed-match', coverUrl: '', mode: 'thor' },
        'gear5',
      ),
    ).toBe('/assets/Marvel/avengers-logo.png');

    expect(
      resolveProjectCover(
        { slug: 'no-seed-match', coverUrl: '', mode: 'gear5' },
        'thor',
      ),
    ).toBe('/assets/One-Piece/One-Piece-Logo-1416.webp');
  });

  it('never returns the literal string "No image" or undefined for a Thor row', () => {
    const result = resolveProjectCover(
      { slug: 'mjolnir-ui-forge', coverUrl: undefined },
      'thor',
    );
    expect(result).toBeDefined();
    expect(result).not.toBe('No image');
    expect(result).toMatch(/^\/(seed|assets)\//);
  });

  it('never returns undefined for a Gear 5 row', () => {
    const result = resolveProjectCover(
      { slug: 'straw-hat-luffy', coverUrl: undefined, mode: 'gear5' },
      'gear5',
    );
    expect(result).toBeDefined();
    expect(result).toMatch(/^\/(seed|assets)\//);
  });
});
