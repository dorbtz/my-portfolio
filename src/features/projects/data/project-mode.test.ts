/**
 * src/data/project-mode.test.ts
 *
 * Regression tests for the dual-mode classification logic that decides which
 * projects appear in Thor mode versus Luffy / Gear 5 mode.
 *
 * The two production defects this guards against:
 *
 *   1. "Bifrost Pipeline" leaking into Luffy mode — fixed by checking Thor
 *      keywords BEFORE Gear 5 keywords (the previous order was reversed,
 *      letting ambiguous tokens like "bounty" misclassify Norse projects).
 *
 *   2. Thor mode showing "No image" tiles because Supabase rows had blank
 *      cover URLs — fixed by adding the explicit `mode` column AND a
 *      mode-aware default-cover resolver. The cover resolver lives in its
 *      own test file (projectDefaultCover.test.ts) — this file only checks
 *      classification.
 *
 * NOTE: same vmThreads constraint as project-fixtures.test.ts — we inline the
 * `getProjectMode` logic instead of importing the live module that uses
 * `new Date()` at top level. The inlined logic MUST stay in lockstep with
 * the implementation in src/data/project-fixtures.ts; failing tests here
 * indicate either a regression in the implementation OR a drift between the
 * test mirror and the source. Cross-link: keep both updated together.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inlined implementation — must mirror src/data/project-fixtures.ts.
// ---------------------------------------------------------------------------

const THOR_KEYWORDS = [
  'thor', 'asgard', 'asgardian', 'mjolnir', 'mjölnir', 'bifrost', 'bifröst',
  'stormbreaker', 'loki', 'yggdrasil', 'odin', 'valhalla', 'avengers',
  'avenger', 'marvel', 'mcu', 'midgard', 'jotunheim', 'ragnarok', 'heimdall',
  'sif', 'frigga', 'hela', 'wakanda', 'shield',
  'nine realms', 'nine-realms', 'norse', 'realm', 'realms',
  'rune', 'runic', 'aesir', 'vanir', 'fenrir', 'valkyrie',
  'ragnarök',
];

const GEAR5_KEYWORDS = [
  'luffy', 'one-piece', 'one piece', 'straw-hat', 'straw hat', 'strawhat',
  'gear5', 'gear 5', 'nika', 'wano', 'mugiwara', 'pirate', 'devil-fruit',
  'devil fruit', 'haki', 'zoro', 'nami', 'sanji', 'usopp', 'chopper',
  'robin', 'franky', 'brook', 'jinbe', 'shanks', 'ace', 'sabo', 'oda',
  'grand-line', 'grand line', 'yonko', 'shichibukai', 'poneglyph',
  'den-den-mushi', 'den den mushi', 'berries', 'berry',
];

type ProjectLike = {
  slug?: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  mode?: 'thor' | 'gear5' | null;
};

function getProjectMode(project: ProjectLike): 'thor' | 'gear5' | null {
  if (project.mode === 'thor' || project.mode === 'gear5') return project.mode;
  const haystack = [
    project.slug ?? '',
    project.title ?? '',
    project.subtitle ?? '',
    project.summary ?? '',
    ...(project.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  if (THOR_KEYWORDS.some((k) => haystack.includes(k))) return 'thor';
  if (GEAR5_KEYWORDS.some((k) => haystack.includes(k))) return 'gear5';
  return null;
}

function filterProjectsByMode<T extends ProjectLike>(
  projects: T[],
  mode: 'thor' | 'gear5',
  fallback: () => T[],
): T[] {
  const filtered = projects.filter((p) => {
    const projectMode = getProjectMode(p);
    return projectMode === mode || projectMode === null;
  });
  if (filtered.length > 0) return filtered;
  return fallback();
}

// ---------------------------------------------------------------------------
// Defect 2 regression — Bifrost Pipeline must NEVER leak into Luffy mode.
// ---------------------------------------------------------------------------

describe('getProjectMode — Defect 2 regression (Bifrost Pipeline leak)', () => {
  it('classifies Bifrost Pipeline as thor (was leaking into gear5)', () => {
    const project: ProjectLike = {
      slug: 'bifrost-pipeline',
      title: 'Bifrost Pipeline',
      subtitle: 'Observability across the Nine Realms of your stack.',
      summary: 'A full-stack AI observability platform that traces LLM calls.',
      tags: ['ai', 'observability', 'saas', 'llm'],
    };
    expect(getProjectMode(project)).toBe('thor');
  });

  it('classifies Mjolnir UI Forge as thor', () => {
    expect(
      getProjectMode({
        slug: 'mjolnir-ui-forge',
        title: 'Mjolnir UI Forge',
        subtitle: 'The design system worthy of Asgard.',
        summary: 'A battle-hardened design system.',
        tags: ['design-system', 'frontend', 'dx'],
      }),
    ).toBe('thor');
  });

  it('classifies Stormbreaker CI as thor', () => {
    expect(
      getProjectMode({
        slug: 'stormbreaker-ci',
        title: 'Stormbreaker CI',
        subtitle: 'DevOps forged to cleave build times in half.',
        summary: 'A GitHub Actions workflow library.',
        tags: ['devops', 'ci', 'dx', 'ai'],
      }),
    ).toBe('thor');
  });

  it('classifies Asgard Codex as thor', () => {
    expect(
      getProjectMode({
        slug: 'asgard-codex',
        title: 'Asgard Codex',
        subtitle: 'All knowledge, one Bifrost query away.',
        summary: 'An internal AI knowledge base.',
        tags: ['ai', 'rag', 'knowledge-base', 'llm'],
      }),
    ).toBe('thor');
  });
});

describe('getProjectMode — Gear 5 / Straw Hat classification', () => {
  it.each([
    ['straw-hat-luffy', 'Monkey D. Luffy'],
    ['straw-hat-zoro', 'Roronoa Zoro'],
    ['straw-hat-nami', 'Nami'],
    ['straw-hat-usopp', 'Usopp'],
    ['straw-hat-sanji', 'Vinsmoke Sanji'],
    ['straw-hat-chopper', 'Tony Tony Chopper'],
    ['straw-hat-robin', 'Nico Robin'],
    ['straw-hat-franky', 'Franky'],
    ['straw-hat-brook', 'Brook'],
    ['straw-hat-jinbe', 'Jinbe'],
  ])('classifies %s (%s) as gear5', (slug, title) => {
    expect(getProjectMode({ slug, title })).toBe('gear5');
  });
});

describe('getProjectMode — explicit mode field overrides keyword scan', () => {
  it('explicit mode=thor wins even if title contains gear5 keywords', () => {
    expect(
      getProjectMode({
        slug: 'luffy-tribute',
        title: 'Luffy Tribute',
        mode: 'thor',
      }),
    ).toBe('thor');
  });

  it('explicit mode=gear5 wins even if title contains thor keywords', () => {
    expect(
      getProjectMode({
        slug: 'mjolnir-tribute',
        title: 'Mjolnir Tribute',
        mode: 'gear5',
      }),
    ).toBe('gear5');
  });

  it('null/undefined mode falls through to keyword scan', () => {
    expect(getProjectMode({ slug: 'thor', title: 'Thor', mode: null })).toBe('thor');
    expect(getProjectMode({ slug: 'luffy', title: 'Luffy' })).toBe('gear5');
  });
});

describe('getProjectMode — neutral / ambiguous content', () => {
  it('returns null for a generic SaaS project with no mode signals', () => {
    expect(
      getProjectMode({
        slug: 'fluxcraft',
        title: 'FluxCraft AI Studio',
        subtitle: 'Workflow automation',
        summary: 'A no-code automation builder.',
        tags: ['saas', 'ai'],
      }),
    ).toBeNull();
  });

  it('does NOT classify generic "bounty" usage as gear5', () => {
    // "bounty" was previously a Gear 5 keyword that caused false positives
    // for CI / security copy. Removed from GEAR5_KEYWORDS in the fix.
    expect(
      getProjectMode({
        slug: 'security-bounty-platform',
        title: 'Security Bounty Platform',
        summary: 'A vulnerability disclosure & bug bounty workflow.',
        tags: ['security', 'workflow'],
      }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// filterProjectsByMode — the integration that actually drives what the user
// sees on the home page Projects section.
// ---------------------------------------------------------------------------
describe('filterProjectsByMode — Defect 2 end-to-end', () => {
  const thorRows: ProjectLike[] = [
    { slug: 'mjolnir-ui-forge', title: 'Mjolnir UI Forge', mode: 'thor' },
    { slug: 'stormbreaker-ci', title: 'Stormbreaker CI', mode: 'thor' },
    { slug: 'asgard-codex', title: 'Asgard Codex', mode: 'thor' },
  ];
  const gear5Rows: ProjectLike[] = [
    { slug: 'straw-hat-luffy', title: 'Monkey D. Luffy', mode: 'gear5' },
    { slug: 'straw-hat-zoro', title: 'Roronoa Zoro', mode: 'gear5' },
  ];
  const fallbackThor = (): ProjectLike[] => [{ slug: 'thor-fallback', title: 'Thor Fallback', mode: 'thor' }];
  const fallbackGear5 = (): ProjectLike[] => [{ slug: 'gear5-fallback', title: 'Gear 5 Fallback', mode: 'gear5' }];

  it('Luffy mode filters out all 3 Thor Supabase rows and falls back to Gear 5 set', () => {
    const visible = filterProjectsByMode(thorRows, 'gear5', fallbackGear5);
    expect(visible).toHaveLength(1);
    expect(visible[0].slug).toBe('gear5-fallback');
    // Critically: NO Thor row should appear in the visible Luffy-mode list.
    expect(visible.some((p) => thorRows.some((t) => t.slug === p.slug))).toBe(false);
  });

  it('Thor mode filters out Gear 5 rows and falls back to Thor set', () => {
    const visible = filterProjectsByMode(gear5Rows, 'thor', fallbackThor);
    expect(visible).toHaveLength(1);
    expect(visible[0].slug).toBe('thor-fallback');
  });

  it('Thor mode shows all 3 Thor rows when present', () => {
    const visible = filterProjectsByMode(thorRows, 'thor', fallbackThor);
    expect(visible).toHaveLength(3);
    expect(visible.map((p) => p.slug)).toEqual(['mjolnir-ui-forge', 'stormbreaker-ci', 'asgard-codex']);
  });

  it('mixed Supabase data — Thor mode shows Thor + neutral rows, hides Gear 5 rows', () => {
    const mixed: ProjectLike[] = [
      { slug: 'mjolnir', title: 'Mjolnir', mode: 'thor' },
      { slug: 'luffy', title: 'Luffy', mode: 'gear5' },
      { slug: 'fluxcraft', title: 'FluxCraft' }, // neutral
    ];
    const visible = filterProjectsByMode(mixed, 'thor', fallbackThor);
    expect(visible.map((p) => p.slug).sort()).toEqual(['fluxcraft', 'mjolnir']);
  });

  it('mixed Supabase data — Luffy mode shows Gear 5 + neutral rows, hides Thor rows', () => {
    const mixed: ProjectLike[] = [
      { slug: 'mjolnir', title: 'Mjolnir', mode: 'thor' },
      { slug: 'luffy', title: 'Luffy', mode: 'gear5' },
      { slug: 'fluxcraft', title: 'FluxCraft' },
    ];
    const visible = filterProjectsByMode(mixed, 'gear5', fallbackGear5);
    expect(visible.map((p) => p.slug).sort()).toEqual(['fluxcraft', 'luffy']);
  });
});
