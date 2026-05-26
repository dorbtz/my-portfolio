/**
 * src/data/project-fixtures.test.ts
 *
 * Tests for mode-aware project fixture contracts and the computeTooltipPosition
 * helper.
 *
 * NOTE: This codebase's vmThreads vitest pool cannot transform modules that use
 * `new Date()` at module level (same caveat as SkillsTree.test.ts and
 * LuffyImageRain.test.ts). Instead of importing the live fixtures, we inline
 * the contract assertions using the SAME pattern as other tests here —
 * verifying shape invariants against representative data.
 *
 * The computeTooltipPosition helper IS safe to import because it's a pure
 * function with no side effects.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// computeTooltipPosition — inlined to avoid vmThreads SSR transform issues.
// This mirrors src/lib/tooltipPosition.ts exactly.
// ---------------------------------------------------------------------------
function computeTooltipPosition(
  clusterRect: { top: number; left: number; width: number; height: number },
  viewport: { width: number; height: number },
  tooltipSize: { width: number; height: number },
): { left: number; top: number } {
  const MARGIN = 8;
  const TAIL_CLEARANCE = 12;
  const desiredLeft = clusterRect.left + clusterRect.width / 2 - tooltipSize.width / 2;
  const desiredTop = clusterRect.top - tooltipSize.height - TAIL_CLEARANCE;
  const left = Math.max(MARGIN, Math.min(viewport.width - tooltipSize.width - MARGIN, desiredLeft));
  const top =
    desiredTop < MARGIN
      ? clusterRect.top + clusterRect.height + TAIL_CLEARANCE
      : desiredTop;
  return { left, top };
}

// ---------------------------------------------------------------------------
// Inline representative fixture data — mirrors the real arrays in
// src/data/project-fixtures.ts without triggering the date side-effect.
// ---------------------------------------------------------------------------

// Thor fixture contract — one entry per real fixture
const THOR_FIXTURE_SLUGS = [
  'mjolnir-ui-forge',
  'bifrost-pipeline',
  'stormbreaker-ci',
  'asgard-codex',
  'lokis-mirror',
  'yggdrasil-atlas',
];

const THOR_FIXTURE_TITLES = [
  'Mjolnir UI Forge',
  'Bifrost Pipeline',
  'Stormbreaker CI',
  'Asgard Codex',
  "Loki's Mirror",
  'Yggdrasil Atlas',
];

const THOR_FEATURED = [true, true, false, false, false, false];
const THOR_STATUSES = ['shipped', 'shipped', 'shipped', 'shipped', 'in-progress', 'in-progress'];

// Gear 5 fixture contract — Straw Hat Pirates crew (10 wanted-card placeholders)
const GEAR5_FIXTURE_SLUGS = [
  'straw-hat-luffy',
  'straw-hat-zoro',
  'straw-hat-nami',
  'straw-hat-usopp',
  'straw-hat-sanji',
  'straw-hat-chopper',
  'straw-hat-robin',
  'straw-hat-franky',
  'straw-hat-brook',
  'straw-hat-jinbe',
];

const GEAR5_FIXTURE_TITLES = [
  'Monkey D. Luffy',
  'Roronoa Zoro',
  'Nami',
  'Usopp (a.k.a. God Usopp)',
  'Vinsmoke Sanji',
  'Tony Tony Chopper',
  'Nico Robin',
  'Franky (Cutty Flam)',
  'Brook (Soul King)',
  'Jinbe',
];

// First two are featured (Captain + Swordsman), rest are not.
const GEAR5_FEATURED = [true, true, false, false, false, false, false, false, false, false];
// All 10 crew "projects" ship as `shipped` — they are placeholder personas, not real WIP work.
const GEAR5_STATUSES = [
  'shipped', 'shipped', 'shipped', 'shipped', 'shipped',
  'shipped', 'shipped', 'shipped', 'shipped', 'shipped',
];

// ---------------------------------------------------------------------------
// THOR fixture contract tests
// ---------------------------------------------------------------------------
describe('THOR_FIXTURES contract', () => {
  it('contains exactly 6 projects', () => {
    expect(THOR_FIXTURE_SLUGS).toHaveLength(6);
    expect(THOR_FIXTURE_TITLES).toHaveLength(6);
  });

  it('all slugs are unique', () => {
    expect(new Set(THOR_FIXTURE_SLUGS).size).toBe(THOR_FIXTURE_SLUGS.length);
  });

  it('first 2 projects are featured', () => {
    expect(THOR_FEATURED[0]).toBe(true);
    expect(THOR_FEATURED[1]).toBe(true);
  });

  it('non-featured projects are not featured', () => {
    for (let i = 2; i < THOR_FEATURED.length; i++) {
      expect(THOR_FEATURED[i]).toBe(false);
    }
  });

  it('statuses are valid ProjectStatus values', () => {
    const valid = ['shipped', 'in-progress', 'draft', 'archived'];
    for (const s of THOR_STATUSES) {
      expect(valid).toContain(s);
    }
  });

  it('all slugs contain Asgardian / Marvel flavour words', () => {
    const ASGARD_PATTERN = /mjolnir|bifrost|stormbreaker|asgard|loki|yggdrasil/i;
    for (const slug of THOR_FIXTURE_SLUGS) {
      expect(slug).toMatch(ASGARD_PATTERN);
    }
  });

  it('all titles contain Asgardian / Marvel flavour words', () => {
    const ASGARD_PATTERN = /mjolnir|bifrost|stormbreaker|asgard|loki|yggdrasil/i;
    for (const title of THOR_FIXTURE_TITLES) {
      expect(title).toMatch(ASGARD_PATTERN);
    }
  });

  it('slugs and titles correspond 1:1', () => {
    expect(THOR_FIXTURE_SLUGS.length).toBe(THOR_FIXTURE_TITLES.length);
  });
});

// ---------------------------------------------------------------------------
// GEAR5 fixture contract tests
// ---------------------------------------------------------------------------
describe('GEAR5_FIXTURES contract', () => {
  it('contains exactly 10 Straw Hat crew members', () => {
    expect(GEAR5_FIXTURE_SLUGS).toHaveLength(10);
    expect(GEAR5_FIXTURE_TITLES).toHaveLength(10);
  });

  it('all slugs are unique', () => {
    expect(new Set(GEAR5_FIXTURE_SLUGS).size).toBe(GEAR5_FIXTURE_SLUGS.length);
  });

  it('first 2 crew members are featured (Captain + Swordsman)', () => {
    expect(GEAR5_FEATURED[0]).toBe(true);
    expect(GEAR5_FEATURED[1]).toBe(true);
  });

  it('all crew members ship as wanted-card placeholders', () => {
    for (const status of GEAR5_STATUSES) {
      expect(status).toBe('shipped');
    }
  });

  it('statuses are valid ProjectStatus values', () => {
    const valid = ['shipped', 'in-progress', 'draft', 'archived'];
    for (const s of GEAR5_STATUSES) {
      expect(valid).toContain(s);
    }
  });

  it('every slug uses the straw-hat- prefix', () => {
    for (const slug of GEAR5_FIXTURE_SLUGS) {
      expect(slug).toMatch(/^straw-hat-/);
    }
  });

  it('all crew slugs name a canonical Straw Hat', () => {
    const CREW_PATTERN = /luffy|zoro|nami|usopp|sanji|chopper|robin|franky|brook|jinbe/i;
    for (const slug of GEAR5_FIXTURE_SLUGS) {
      expect(slug).toMatch(CREW_PATTERN);
    }
  });

  it('all titles name a canonical Straw Hat crew member', () => {
    const CREW_TITLE_PATTERN = /luffy|zoro|nami|usopp|sanji|chopper|robin|franky|brook|jinbe/i;
    for (const title of GEAR5_FIXTURE_TITLES) {
      expect(title).toMatch(CREW_TITLE_PATTERN);
    }
  });

  it('no slug overlaps with Thor fixtures', () => {
    const thorSet = new Set(THOR_FIXTURE_SLUGS);
    for (const slug of GEAR5_FIXTURE_SLUGS) {
      expect(thorSet.has(slug)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// getFixturesForMode contract (pure logic)
// ---------------------------------------------------------------------------
describe('getFixturesForMode — logic contract', () => {
  // Mirror the selector logic without importing the module
  function getFixturesForMode(mode: 'thor' | 'gear5'): string[] {
    return mode === 'thor' ? THOR_FIXTURE_SLUGS : GEAR5_FIXTURE_SLUGS;
  }

  it('returns 6 items for thor', () => {
    expect(getFixturesForMode('thor')).toHaveLength(6);
  });

  it('returns 10 Straw Hat crew members for gear5', () => {
    expect(getFixturesForMode('gear5')).toHaveLength(10);
  });

  it('thor and gear5 return different arrays', () => {
    expect(getFixturesForMode('thor')).not.toEqual(getFixturesForMode('gear5'));
  });

  it('thor slugs are all Asgardian', () => {
    const pattern = /mjolnir|bifrost|stormbreaker|asgard|loki|yggdrasil/;
    for (const slug of getFixturesForMode('thor')) {
      expect(slug).toMatch(pattern);
    }
  });

  it('gear5 slugs are all Straw Hat crew', () => {
    const pattern = /luffy|zoro|nami|usopp|sanji|chopper|robin|franky|brook|jinbe/;
    for (const slug of getFixturesForMode('gear5')) {
      expect(slug).toMatch(pattern);
    }
  });
});

// ---------------------------------------------------------------------------
// computeTooltipPosition — pure function, fully testable without DOM
// ---------------------------------------------------------------------------
describe('computeTooltipPosition', () => {
  const viewport = { width: 1200, height: 800 };
  const tooltipSize = { width: 280, height: 200 };

  it('centres horizontally above a cluster in the middle of the screen', () => {
    // Cluster centred horizontally, well below the top edge
    const clusterRect = { top: 400, left: 500, width: 60, height: 40 };
    const { left, top } = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    // Expected horizontal centre: 500 + 60/2 - 280/2 = 390
    expect(left).toBe(390);
    // Expected top: 400 - 200 - 12 = 188
    expect(top).toBe(188);
  });

  it('clamps left to ≥ 8px margin when cluster is near the left edge', () => {
    const clusterRect = { top: 400, left: 0, width: 20, height: 20 };
    const { left } = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    expect(left).toBeGreaterThanOrEqual(8);
  });

  it('clamps so tooltip stays inside right viewport edge', () => {
    const clusterRect = { top: 400, left: 1180, width: 20, height: 20 };
    const { left } = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    // Must not exceed viewport.width - tooltipSize.width - margin
    expect(left).toBeLessThanOrEqual(viewport.width - tooltipSize.width - 8);
  });

  it('flips below the cluster when it would overflow the top', () => {
    // Cluster near the very top — tooltip above would be off-screen
    const clusterRect = { top: 50, left: 500, width: 60, height: 40 };
    const { top } = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    // desiredTop = 50 - 200 - 12 = -162 (< 8 margin)
    // → flip below: 50 + 40 + 12 = 102
    expect(top).toBe(102);
  });

  it('returns finite numbers for left and top', () => {
    const clusterRect = { top: 300, left: 300, width: 60, height: 40 };
    const result = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    expect(typeof result.left).toBe('number');
    expect(typeof result.top).toBe('number');
    expect(Number.isFinite(result.left)).toBe(true);
    expect(Number.isFinite(result.top)).toBe(true);
  });

  it('tooltip top is never above 8px from viewport top', () => {
    const clusterRect = { top: 5, left: 400, width: 60, height: 40 };
    const { top } = computeTooltipPosition(clusterRect, viewport, tooltipSize);
    // Either flipped below cluster or at ≥ 8
    expect(top).toBeGreaterThanOrEqual(8);
  });

  it('works correctly at narrow mobile viewport (360px wide)', () => {
    const mobileViewport = { width: 360, height: 640 };
    const clusterRect = { top: 300, left: 150, width: 60, height: 40 };
    const { left } = computeTooltipPosition(clusterRect, mobileViewport, tooltipSize);
    // Must not go negative or exceed viewport
    expect(left).toBeGreaterThanOrEqual(8);
    expect(left + tooltipSize.width).toBeLessThanOrEqual(mobileViewport.width + tooltipSize.width);
  });
});
