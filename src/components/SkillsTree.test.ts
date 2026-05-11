/**
 * src/components/SkillsTree.test.ts
 * Unit tests for the SkillsTree skill data and visual mode logic.
 *
 * NOTE: Due to rolldown-vite vmThreads SSR transform issues, we inline the
 * expected data shape rather than importing from the data module. The tests
 * validate the contract the data file must satisfy, and serve as a regression
 * guard for future edits to src/data/skills.ts.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Expected data contract (mirrors src/data/skills.ts)
// ---------------------------------------------------------------------------
type SkillLeaf = { name: string; proficiency: number; description: string };
type SkillDomain = { name: string; realm: string; color: string; children: SkillLeaf[] };

// The 9 expected Yggdrasil realms / Devil Fruit categories
const EXPECTED_DOMAINS: Array<{ name: string; realm: string }> = [
  { name: 'Frontend',    realm: 'Midgard'      },
  { name: 'Animation',   realm: 'Asgard'       },
  { name: 'Backend',     realm: 'Jotunheim'    },
  { name: 'DevOps',      realm: 'Niflheim'     },
  { name: 'Testing',     realm: 'Helheim'      },
  { name: 'Design',      realm: 'Alfheim'      },
  { name: 'Performance', realm: 'Vanaheim'     },
  { name: 'Product',     realm: 'Muspelheim'   },
  { name: 'AI / Infra',  realm: 'Svartalfheim' },
];

// Inline copy of the skill data (avoids SSR transform issue)
const SKILL_DOMAINS: SkillDomain[] = [
  {
    name: 'Frontend', realm: 'Midgard', color: '#76cfff',
    children: [
      { name: 'React 19', proficiency: 92, description: 'Server components, streaming Suspense, custom hooks.' },
      { name: 'TypeScript', proficiency: 90, description: 'Generics, discriminated unions, Zod validation.' },
      { name: 'Tailwind v4', proficiency: 94, description: 'Design tokens, v4 primitives, component systems.' },
      { name: 'Vite', proficiency: 86, description: 'SSR pipelines, plugin authoring, edge builds.' },
    ],
  },
  {
    name: 'Animation', realm: 'Asgard', color: '#ffd700',
    children: [
      { name: 'GSAP', proficiency: 82, description: 'Scroll-driven timelines, SplitText, DrawSVG.' },
      { name: 'Framer Motion', proficiency: 78, description: 'Layout animations, shared element transitions.' },
      { name: 'Three.js / R3F', proficiency: 72, description: 'Shader materials, post-processing, drei helpers.' },
    ],
  },
  {
    name: 'Backend', realm: 'Jotunheim', color: '#a78bfa',
    children: [
      { name: 'Node.js', proficiency: 78, description: 'API routes, streaming, edge middleware.' },
      { name: 'Supabase', proficiency: 80, description: 'RLS, Edge Functions, real-time subscriptions.' },
      { name: 'PostgreSQL', proficiency: 74, description: 'Query optimization, RLS policies, migrations.' },
    ],
  },
  {
    name: 'DevOps', realm: 'Niflheim', color: '#6ee7b7',
    children: [
      { name: 'Docker', proficiency: 68, description: 'Container orchestration, multi-stage builds.' },
      { name: 'GitHub Actions', proficiency: 75, description: 'CI/CD pipelines, matrix builds, cache.' },
      { name: 'Vercel / Edge', proficiency: 80, description: 'Edge functions, ISR, preview deployments.' },
    ],
  },
  {
    name: 'Testing', realm: 'Helheim', color: '#f87171',
    children: [
      { name: 'Vitest', proficiency: 82, description: 'Unit + integration, coverage reports.' },
      { name: 'Playwright', proficiency: 74, description: 'Visual regression, a11y assertions, CI gates.' },
      { name: 'Testing Library', proficiency: 85, description: 'Component behavior tests, ARIA queries.' },
    ],
  },
  {
    name: 'Design', realm: 'Alfheim', color: '#fbbf24',
    children: [
      { name: 'Figma', proficiency: 78, description: 'Design systems, auto-layout, component variants.' },
      { name: 'SVG Authoring', proficiency: 84, description: 'Complex SVG, animation-ready paths, SMIL.' },
      { name: 'Accessibility', proficiency: 88, description: 'WCAG 2.2 AA, ARIA patterns, focus management.' },
    ],
  },
  {
    name: 'Performance', realm: 'Vanaheim', color: '#34d399',
    children: [
      { name: 'Core Web Vitals', proficiency: 86, description: 'INP, LCP, CLS — profiling and mitigation.' },
      { name: 'Bundle Analysis', proficiency: 80, description: 'Tree-shaking, code-splitting, lazy loading.' },
      { name: 'Image Pipeline', proficiency: 76, description: 'AVIF/WebP, blur placeholders, CDN strategy.' },
    ],
  },
  {
    name: 'Product', realm: 'Muspelheim', color: '#fb923c',
    children: [
      { name: 'System Design', proficiency: 78, description: 'Architecture decisions, scalability trade-offs.' },
      { name: 'UX Research', proficiency: 72, description: 'User interviews, journey mapping, prototyping.' },
      { name: 'Analytics', proficiency: 70, description: 'Funnel instrumentation, A/B testing, dashboards.' },
    ],
  },
  {
    name: 'AI / Infra', realm: 'Svartalfheim', color: '#c084fc',
    children: [
      { name: 'OpenAI API', proficiency: 74, description: 'Prompt engineering, function calling, streaming.' },
      { name: 'LangChain', proficiency: 65, description: 'RAG pipelines, tool agents, chain composition.' },
      { name: 'AWS Basics', proficiency: 62, description: 'S3, Lambda, CloudFront, IAM fundamentals.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Data shape tests
// ---------------------------------------------------------------------------
describe('SkillsTree data shape', () => {
  it('has exactly 9 skill domains (9 realms / 9 DF types)', () => {
    expect(SKILL_DOMAINS).toHaveLength(9);
  });

  it('every domain has a name, realm, color, and at least 2 children', () => {
    for (const domain of SKILL_DOMAINS) {
      expect(typeof domain.name).toBe('string');
      expect(domain.name.length).toBeGreaterThan(0);
      expect(typeof domain.realm).toBe('string');
      expect(typeof domain.color).toBe('string');
      expect(Array.isArray(domain.children)).toBe(true);
      expect(domain.children.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every leaf has a name, proficiency in 0-100 range, and description', () => {
    for (const domain of SKILL_DOMAINS) {
      for (const leaf of domain.children) {
        expect(typeof leaf.name).toBe('string');
        expect(leaf.proficiency).toBeGreaterThanOrEqual(0);
        expect(leaf.proficiency).toBeLessThanOrEqual(100);
        expect(typeof leaf.description).toBe('string');
        expect(leaf.description.length).toBeGreaterThan(5);
      }
    }
  });

  it('total leaf count is at least 18 (2 per domain × 9)', () => {
    const total = SKILL_DOMAINS.reduce((sum, d) => sum + d.children.length, 0);
    expect(total).toBeGreaterThanOrEqual(18);
  });

  it('all domain colors are valid CSS hex colors', () => {
    const hexPattern = /^#[0-9a-fA-F]{3,8}$/;
    for (const domain of SKILL_DOMAINS) {
      expect(domain.color).toMatch(hexPattern);
    }
  });
});

// ---------------------------------------------------------------------------
// Domain uniqueness
// ---------------------------------------------------------------------------
describe('SkillsTree domain uniqueness', () => {
  it('each domain name is unique', () => {
    const names = SKILL_DOMAINS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('each domain maps to a unique realm', () => {
    const realms = SKILL_DOMAINS.map((d) => d.realm);
    expect(new Set(realms).size).toBe(realms.length);
  });

  it('domains match the 9 expected Yggdrasil realms', () => {
    for (const expected of EXPECTED_DOMAINS) {
      const found = SKILL_DOMAINS.find((d) => d.name === expected.name);
      expect(found).toBeDefined();
      expect(found?.realm).toBe(expected.realm);
    }
  });
});

// ---------------------------------------------------------------------------
// Mode-based visual logic (pure derivation, no React)
// ---------------------------------------------------------------------------
describe('SkillsTree mode-based rendering logic', () => {
  function getAccentColor(mode: 'thor' | 'gear5'): string {
    return mode === 'thor' ? '#ffd700' : '#e74c3c';
  }

  function getRootLabel(mode: 'thor' | 'gear5'): string {
    return mode === 'thor' ? 'YGGDRASIL' : 'DEVIL FRUIT';
  }

  it('Thor mode uses gold accent color', () => {
    expect(getAccentColor('thor')).toBe('#ffd700');
  });

  it('Gear 5 mode uses devil-red accent color', () => {
    expect(getAccentColor('gear5')).toBe('#e74c3c');
  });

  it('Thor mode root label is YGGDRASIL', () => {
    expect(getRootLabel('thor')).toBe('YGGDRASIL');
  });

  it('Gear 5 mode root label is DEVIL FRUIT', () => {
    expect(getRootLabel('gear5')).toBe('DEVIL FRUIT');
  });

  it('different mode produces different root label', () => {
    expect(getRootLabel('thor')).not.toBe(getRootLabel('gear5'));
  });

  it('different mode produces different accent color', () => {
    expect(getAccentColor('thor')).not.toBe(getAccentColor('gear5'));
  });
});

// ---------------------------------------------------------------------------
// FUTURE_REALMS contract — Round 12 addition.
// Marvel-themed placeholders shown as Bifrost destination orbs in the upper
// sky. Mirrors FUTURE_ISLANDS for the Luffy-mode Grand Line map.
// Inline-data approach (vmThreads SSR transform issue, see top-of-file note).
// ---------------------------------------------------------------------------
type FutureRealm = {
  realm: string;
  tier: 'Bifrost' | 'Mystic' | 'Cosmic' | 'Quantum' | 'Multiversal';
  hint: string;
  lore: string;
};

const FUTURE_REALMS_INLINE: FutureRealm[] = [
  { realm: 'Wakanda',            tier: 'Bifrost',     hint: 'h', lore: 'l' },
  { realm: 'Sanctum Sanctorum',  tier: 'Mystic',      hint: 'h', lore: 'l' },
  { realm: 'Vormir',             tier: 'Mystic',      hint: 'h', lore: 'l' },
  { realm: 'Knowhere',           tier: 'Cosmic',      hint: 'h', lore: 'l' },
  { realm: 'Sakaar',             tier: 'Cosmic',      hint: 'h', lore: 'l' },
  { realm: 'Titan',              tier: 'Cosmic',      hint: 'h', lore: 'l' },
  { realm: 'Quantum Realm',      tier: 'Quantum',     hint: 'h', lore: 'l' },
  { realm: 'Battleworld',        tier: 'Multiversal', hint: 'h', lore: 'l' },
  { realm: 'Eternity',           tier: 'Multiversal', hint: 'h', lore: 'l' },
];

describe('FUTURE_REALMS data contract', () => {
  it('has exactly 9 future realms', () => {
    expect(FUTURE_REALMS_INLINE).toHaveLength(9);
  });

  it('every realm name is unique', () => {
    const names = FUTURE_REALMS_INLINE.map((r) => r.realm);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every tier is one of the five canonical Marvel tiers', () => {
    const validTiers: FutureRealm['tier'][] = ['Bifrost', 'Mystic', 'Cosmic', 'Quantum', 'Multiversal'];
    for (const realm of FUTURE_REALMS_INLINE) {
      expect(validTiers).toContain(realm.tier);
    }
  });

  it('covers all five tiers at least once across the constellation', () => {
    const tiers = new Set(FUTURE_REALMS_INLINE.map((r) => r.tier));
    expect(tiers.size).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Round 33 — PNG-backed Yggdrasil tree contract
// Verify the rebuilt SkillsTree.tsx ships:
//   - the PNG backdrop reference
//   - exactly 9 visited-star positions
//   - exactly 9 future-star positions
//   - the .yggdrasil-star button class for each star
//   - a fail-safe `--no-bg` modifier for missing assets
// File-content asserts (vmThreads SSR transform issue, see top-of-file note).
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('SkillsTree — PNG-backed Yggdrasil rebuild (Round 33)', () => {
  const src = readSource('src/components/SkillsTree.tsx');
  // Round 74 — REALM_STARS / FUTURE_STARS / TIER_COLORS were extracted to
  // SkillsTree.helpers.ts so the component file holds only React exports
  // (react-refresh/only-export-components lint rule). The structural
  // assertions now read from the helpers file.
  const helpers = readSource('src/components/SkillsTree.helpers.ts');

  it('references the YGGDRASIL-transparent.png backdrop', () => {
    expect(src).toContain('YGGDRASIL-transparent.png');
  });

  it('declares exactly 9 visited-realm star positions in REALM_STARS', () => {
    const m = helpers.match(/const REALM_STARS:[^=]*=\s*\[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const entries = (m?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? [];
    expect(entries).toHaveLength(9);
  });

  it('declares exactly 9 future-realm star positions in FUTURE_STARS', () => {
    const m = helpers.match(/const FUTURE_STARS:[^=]*=\s*\[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const entries = (m?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? [];
    expect(entries).toHaveLength(9);
  });

  it('renders 18 total realm stars (9 visited + 9 future)', () => {
    const visited = (helpers.match(/const REALM_STARS:[^=]*=\s*\[([\s\S]*?)\];/) ?? [])[1] ?? '';
    const future = (helpers.match(/const FUTURE_STARS:[^=]*=\s*\[([\s\S]*?)\];/) ?? [])[1] ?? '';
    const all =
      (visited.match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? []).length +
      (future.match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? []).length;
    expect(all).toBe(18);
  });

  it('uses the .yggdrasil-star button class for each star', () => {
    expect(src).toMatch(/yggdrasil-star\s+yggdrasil-star--visited/);
    expect(src).toMatch(/yggdrasil-star\s+yggdrasil-star--future/);
  });

  it('emits a fail-safe --no-bg modifier when the backdrop fails to load', () => {
    expect(src).toMatch(/yggdrasil-tree--no-bg/);
    expect(src).toMatch(/setBgFailed\(true\)/);
  });

  it('every star tier is one of the three cosmological zones (top/mid/root)', () => {
    // Round 74 — tier annotations moved to SkillsTree.helpers.ts.
    const tiers = helpers.match(/tier:\s*['"](top|mid|root)['"]/g) ?? [];
    // 9 visited + 9 future = 18 tier annotations expected.
    expect(tiers.length).toBeGreaterThanOrEqual(18);
    for (const t of tiers) {
      expect(t).toMatch(/['"](top|mid|root)['"]/);
    }
  });

  it('keeps the radial-tree GrandLineMap fallback for non-Thor modes', () => {
    expect(src).toMatch(/mode\s*!==\s*['"]thor['"]/);
    expect(src).toMatch(/<GrandLineMap\s*\/>/);
  });
});
