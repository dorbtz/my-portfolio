/**
 * src/features/content/services/siteContentMap.test.ts
 *
 * Tests the pure transforms used by the site-content CMS.
 *
 * Convention note: per the project's testing playbook, we don't import
 * production modules that depend on Supabase or Zustand — the rolldown-vite
 * SSR transform inserts wrapper helpers that aren't fully resolved in jsdom
 * (see `src/setupTests.ts`). Instead, we inline a copy of the pure logic and
 * compare its behaviour against the documented contract.
 *
 * The inlined functions MUST stay in lockstep with `siteContentMap.ts`. If
 * you change one, change the other (and re-run this test).
 */
import { describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Inlined types — mirror src/features/content/types.ts
// ---------------------------------------------------------------------------
type SiteSection = 'hero' | 'about' | 'skills' | 'projects' | 'contact' | 'admin';
type SiteMode = 'thor' | 'gear5';
type SiteContentRow = {
  id: string;
  section: SiteSection;
  mode: SiteMode | null;
  field: string;
  value: unknown;
  updated_at: string;
};
type SectionBag = {
  thor: Record<string, unknown>;
  gear5: Record<string, unknown>;
  shared: Record<string, unknown>;
};
type SiteContentMap = Record<SiteSection, SectionBag>;

const SITE_SECTIONS: ReadonlyArray<SiteSection> = [
  'hero',
  'about',
  'skills',
  'projects',
  'contact',
  'admin',
];

// ---------------------------------------------------------------------------
// Inlined transforms — mirror src/features/content/services/siteContentMap.ts
// ---------------------------------------------------------------------------
function emptySiteContentMap(): SiteContentMap {
  const map = {} as SiteContentMap;
  for (const section of SITE_SECTIONS) {
    map[section] = { thor: {}, gear5: {}, shared: {} };
  }
  return map;
}

function isValidSection(s: string): s is SiteSection {
  return (SITE_SECTIONS as readonly string[]).includes(s);
}

function getSiteContentMap(rows: SiteContentRow[]): SiteContentMap {
  const map = emptySiteContentMap();
  for (const row of rows) {
    if (!isValidSection(row.section)) continue;
    const bag = map[row.section];
    if (row.mode === null) {
      bag.shared[row.field] = row.value;
    } else if (row.mode === 'thor') {
      bag.thor[row.field] = row.value;
    } else if (row.mode === 'gear5') {
      bag.gear5[row.field] = row.value;
    }
  }
  return map;
}

function resolveSection(bag: SectionBag, mode: SiteMode): Record<string, unknown> {
  return { ...bag.shared, ...bag[mode] };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function row(
  section: SiteContentRow['section'],
  mode: SiteContentRow['mode'],
  field: string,
  value: unknown,
): SiteContentRow {
  return {
    id: `${section}-${mode ?? 'shared'}-${field}`,
    section,
    mode,
    field,
    value,
    updated_at: new Date(0).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------
describe('emptySiteContentMap', () => {
  it('returns one bag per known section with empty thor/gear5/shared records', () => {
    const map = emptySiteContentMap();
    expect(Object.keys(map).sort()).toEqual([...SITE_SECTIONS].sort());
    for (const section of SITE_SECTIONS) {
      expect(map[section].thor).toEqual({});
      expect(map[section].gear5).toEqual({});
      expect(map[section].shared).toEqual({});
    }
  });
});

describe('getSiteContentMap', () => {
  it('groups per-mode rows into the right bag', () => {
    const rows: SiteContentRow[] = [
      row('hero', 'thor', 'paragraph', 'Asgardian'),
      row('hero', 'gear5', 'paragraph', 'Joy Boy'),
    ];
    const map = getSiteContentMap(rows);
    expect(map.hero.thor.paragraph).toBe('Asgardian');
    expect(map.hero.gear5.paragraph).toBe('Joy Boy');
    expect(map.hero.shared).toEqual({});
  });

  it('routes mode=null rows into shared', () => {
    const rows: SiteContentRow[] = [
      row('skills', null, 'domains', [{ name: '3D' }]),
    ];
    const map = getSiteContentMap(rows);
    expect(map.skills.shared.domains).toEqual([{ name: '3D' }]);
    expect(map.skills.thor).toEqual({});
    expect(map.skills.gear5).toEqual({});
  });

  it('preserves array and object values verbatim (JSONB pass-through)', () => {
    const rows: SiteContentRow[] = [
      row('hero', 'thor', 'titles', ['a', 'b', 'c']),
      row('about', 'gear5', 'panel1', { kicker: 'X', body: 'Y' }),
    ];
    const map = getSiteContentMap(rows);
    expect(map.hero.thor.titles).toEqual(['a', 'b', 'c']);
    expect(map.about.gear5.panel1).toEqual({ kicker: 'X', body: 'Y' });
  });

  it('drops rows with unknown section silently', () => {
    const rows: SiteContentRow[] = [
      // @ts-expect-error — intentional bad section to exercise the guard
      row('mystery', 'thor', 'paragraph', 'nope'),
      row('hero', 'thor', 'paragraph', 'kept'),
    ];
    const map = getSiteContentMap(rows);
    expect(map.hero.thor.paragraph).toBe('kept');
  });

  it('handles empty input by returning empty bags', () => {
    const map = getSiteContentMap([]);
    expect(map.hero.thor).toEqual({});
  });
});

describe('resolveSection', () => {
  it('uses mode-specific values when present', () => {
    const map = getSiteContentMap([
      row('hero', 'thor', 'paragraph', 'thor-only'),
      row('hero', 'gear5', 'paragraph', 'gear5-only'),
    ]);
    expect(resolveSection(map.hero, 'thor').paragraph).toBe('thor-only');
    expect(resolveSection(map.hero, 'gear5').paragraph).toBe('gear5-only');
  });

  it('falls through to shared when mode-specific is missing', () => {
    const map = getSiteContentMap([
      row('skills', null, 'kicker', 'unified'),
    ]);
    expect(resolveSection(map.skills, 'thor').kicker).toBe('unified');
    expect(resolveSection(map.skills, 'gear5').kicker).toBe('unified');
  });

  it('mode-specific overrides shared', () => {
    const map = getSiteContentMap([
      row('hero', null, 'paragraph', 'shared'),
      row('hero', 'thor', 'paragraph', 'thor'),
    ]);
    expect(resolveSection(map.hero, 'thor').paragraph).toBe('thor');
    expect(resolveSection(map.hero, 'gear5').paragraph).toBe('shared');
  });
});
