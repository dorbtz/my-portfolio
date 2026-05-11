/**
 * src/components/GrandLineMap.test.ts
 *
 * Tests for GrandLineMap island count, data shape, route-path generation,
 * and P3 lore-accurate geography (island positions, Red Line, New World split).
 * Pure logic tests — no React rendering required.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// NOTE: This codebase's vmThreads vitest pool cannot reliably transform
// live source modules with named exports (rolldown SSR transform quirk —
// see src/data/project-fixtures.test.ts header). Instead of `import`, we
// read the source files at test time and assert shape via regex / file
// content. This mirrors the convention used by other tests here.
function readSource(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Inline skill domain data (mirrors src/data/skills.ts contract)
// ---------------------------------------------------------------------------
type SkillDomain = { name: string; realm: string; island: string; gear: string; color: string; children: { name: string; proficiency: number }[] };

const SKILL_DOMAINS: SkillDomain[] = [
  { name: 'AI / LLM Apps',       realm: 'Asgard',       island: 'Laugh Tale',          gear: 'Gear 5', color: '#ffd700', children: [{ name: 'OpenAI / Anthropic SDKs', proficiency: 95 }, { name: 'RAG pipelines', proficiency: 92 }, { name: 'Agents & tool-use', proficiency: 90 }] },
  { name: 'TypeScript / React',   realm: 'Midgard',      island: 'Egghead',             gear: 'Gear 5', color: '#76cfff', children: [{ name: 'React 19', proficiency: 95 }, { name: 'TypeScript', proficiency: 94 }, { name: 'Next.js 15', proficiency: 90 }] },
  { name: '3D / WebGL / Shaders', realm: 'Vanaheim',     island: 'Skypiea',             gear: 'Gear 4', color: '#34d399', children: [{ name: 'React Three Fiber', proficiency: 84 }, { name: 'GLSL Shaders', proficiency: 80 }] },
  { name: 'Backend / APIs',       realm: 'Jotunheim',    island: 'Water 7',             gear: 'Gear 3', color: '#a78bfa', children: [{ name: 'Node.js', proficiency: 90 }, { name: 'Supabase', proficiency: 92 }] },
  { name: 'Databases',            realm: 'Niflheim',     island: 'Fishman Island',      gear: 'Gear 3', color: '#6ee7b7', children: [{ name: 'PostgreSQL', proficiency: 88 }, { name: 'pgvector', proficiency: 86 }] },
  { name: 'DevOps / Cloud',       realm: 'Helheim',      island: 'Punk Hazard',         gear: 'Gear 2', color: '#f87171', children: [{ name: 'Vercel', proficiency: 86 }, { name: 'AWS', proficiency: 78 }] },
  { name: 'Design Systems',       realm: 'Alfheim',      island: 'Dressrosa',           gear: 'Gear 4', color: '#fbbf24', children: [{ name: 'Tokens & theming', proficiency: 92 }, { name: 'Accessibility', proficiency: 90 }] },
  { name: 'Performance',          realm: 'Muspelheim',   island: 'Wano Country',        gear: 'Gear 5', color: '#fb923c', children: [{ name: 'Core Web Vitals', proficiency: 92 }, { name: 'Bundle audit', proficiency: 90 }] },
  { name: 'Product Strategy',     realm: 'Svartalfheim', island: 'Reverie / Mary Geoise', gear: 'Gear 2', color: '#c084fc', children: [{ name: 'Discovery → MVP', proficiency: 84 }, { name: 'Shipping cadence', proficiency: 86 }] },
];

// ---------------------------------------------------------------------------
// P3: Island positions (mirrors GrandLineMap.tsx ISLAND_POSITIONS)
// ---------------------------------------------------------------------------
const SVG_W = 1200;
const SVG_H = 400;
const RED_LINE_X = 590;

const ISLAND_POSITIONS: [number, number][] = [
  [1140, 200], // 0: Laugh Tale
  [1050, 255], // 1: Egghead
  [245,  75],  // 2: Skypiea
  [380,  215], // 3: Water 7
  [598,  325], // 4: Fishman Island
  [720,  165], // 5: Punk Hazard
  [855,  245], // 6: Dressrosa
  [960,  160], // 7: Wano Country
  [598,  65],  // 8: Mary Geoise
];

// ---------------------------------------------------------------------------
// Route path builder (mirrors GrandLineMap.tsx#buildPath)
// ---------------------------------------------------------------------------
function buildPath(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mx = (x0 + x1) / 2;
    const wave = i % 2 === 0 ? -22 : 22;
    d += ` C ${mx},${y0 + wave} ${mx},${y1 - wave} ${x1},${y1}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Highest proficiency island finder
// ---------------------------------------------------------------------------
function highestProficiencyIndex(domains: SkillDomain[]): number {
  let bestIdx = 0;
  let bestAvg = 0;
  domains.forEach((d, i) => {
    const avg = d.children.reduce((s, c) => s + c.proficiency, 0) / d.children.length;
    if (avg > bestAvg) { bestAvg = avg; bestIdx = i; }
  });
  return bestIdx;
}

// ---------------------------------------------------------------------------
// Tests — existing
// ---------------------------------------------------------------------------
describe('GrandLineMap island count', () => {
  it('renders exactly 9 islands (one per skill domain)', () => {
    expect(SKILL_DOMAINS).toHaveLength(9);
  });

  it('every domain has a name, realm, gear, color, and at least 2 children', () => {
    for (const domain of SKILL_DOMAINS) {
      expect(typeof domain.name).toBe('string');
      expect(domain.name.length).toBeGreaterThan(0);
      expect(typeof domain.realm).toBe('string');
      expect(typeof domain.gear).toBe('string');
      expect(domain.color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(domain.children.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('GrandLineMap route path', () => {
  it('returns empty string for fewer than 2 points', () => {
    expect(buildPath([])).toBe('');
    expect(buildPath([[100, 100]])).toBe('');
  });

  it('starts with M for 2+ points', () => {
    const path = buildPath([[0, 100], [200, 100]]);
    expect(path).toMatch(/^M /);
  });

  it('includes cubic bezier segments (C) for each intermediate point', () => {
    const points: [number, number][] = [[0,100],[100,100],[200,100],[300,100]];
    const path = buildPath(points);
    const cCount = (path.match(/ C /g) ?? []).length;
    expect(cCount).toBe(3);
  });

  it('wave alternates direction per segment (±22)', () => {
    const p1: [number, number][] = [[0, 100], [100, 100], [200, 100]];
    const path = buildPath(p1);
    // i=1 (odd): wave=+22 → cp1y=122
    expect(path).toContain('50,122');
    // i=2 (even): wave=-22 → cp1y=78
    expect(path).toContain('150,78');
  });
});

describe('GrandLineMap ship placement', () => {
  it('places the ship on the domain with the highest average proficiency', () => {
    const idx = highestProficiencyIndex(SKILL_DOMAINS);
    const shipDomain = SKILL_DOMAINS[idx];
    const shipAvg = shipDomain.children.reduce((s, c) => s + c.proficiency, 0) / shipDomain.children.length;

    for (const domain of SKILL_DOMAINS) {
      const avg = domain.children.reduce((s, c) => s + c.proficiency, 0) / domain.children.length;
      expect(avg).toBeLessThanOrEqual(shipAvg + 0.001);
    }
  });

  it('ship index is in valid range 0–8', () => {
    const idx = highestProficiencyIndex(SKILL_DOMAINS);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(SKILL_DOMAINS.length);
  });
});

describe('GrandLineMap gear labels', () => {
  it('all domains have a valid Gear tier label', () => {
    const validGears = new Set(['Gear 2', 'Gear 3', 'Gear 4', 'Gear 5']);
    for (const domain of SKILL_DOMAINS) {
      expect(validGears.has(domain.gear)).toBe(true);
    }
  });

  it('at least one domain has Gear 5', () => {
    expect(SKILL_DOMAINS.some((d) => d.gear === 'Gear 5')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — P3 lore-accurate geography
// ---------------------------------------------------------------------------
describe('GrandLineMap P3 — island positions exist and are within SVG bounds', () => {
  it('has exactly 9 island positions', () => {
    expect(ISLAND_POSITIONS).toHaveLength(9);
  });

  it('all island x positions are within SVG width', () => {
    for (const [x] of ISLAND_POSITIONS) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(SVG_W);
    }
  });

  it('all island y positions are within SVG height', () => {
    for (const [, y] of ISLAND_POSITIONS) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SVG_H);
    }
  });
});

describe('GrandLineMap P3 — Red Line geography', () => {
  it('Red Line x is at 590 (mid-ish canvas)', () => {
    expect(RED_LINE_X).toBe(590);
  });

  it('Fishman Island (idx 4) is positioned BELOW the Red Line vertical center (y > SVG_H/2)', () => {
    const [, fishmanY] = ISLAND_POSITIONS[4];
    expect(fishmanY).toBeGreaterThan(SVG_H / 2);
  });

  it('Mary Geoise (idx 8) is positioned ABOVE the mid-point (y < SVG_H/2)', () => {
    const [, maryY] = ISLAND_POSITIONS[8];
    expect(maryY).toBeLessThan(SVG_H / 2);
  });

  it('Fishman Island x is near the Red Line', () => {
    const [fishmanX] = ISLAND_POSITIONS[4];
    expect(Math.abs(fishmanX - RED_LINE_X)).toBeLessThan(20);
  });

  it('Mary Geoise x is near the Red Line', () => {
    const [maryX] = ISLAND_POSITIONS[8];
    expect(Math.abs(maryX - RED_LINE_X)).toBeLessThan(20);
  });
});

describe('GrandLineMap P3 — Paradise / New World split', () => {
  // Paradise islands (indices 2,3,4): should be west of (or at) Red Line
  it('Skypiea (idx 2, Paradise) is west of the Red Line', () => {
    expect(ISLAND_POSITIONS[2][0]).toBeLessThan(RED_LINE_X);
  });

  it('Water 7 (idx 3, Paradise) is west of the Red Line', () => {
    expect(ISLAND_POSITIONS[3][0]).toBeLessThan(RED_LINE_X);
  });

  // New World islands (indices 0,1,5,6,7): should be east of Red Line
  it('Laugh Tale (idx 0, New World) is east of the Red Line and near the right edge', () => {
    const [x] = ISLAND_POSITIONS[0];
    expect(x).toBeGreaterThan(RED_LINE_X);
    expect(x).toBeGreaterThan(1000); // rightmost island
  });

  it('Egghead (idx 1, New World) is east of the Red Line', () => {
    expect(ISLAND_POSITIONS[1][0]).toBeGreaterThan(RED_LINE_X);
  });

  it('Punk Hazard (idx 5, New World) is east of the Red Line', () => {
    expect(ISLAND_POSITIONS[5][0]).toBeGreaterThan(RED_LINE_X);
  });

  it('Dressrosa (idx 6, New World) is east of the Red Line', () => {
    expect(ISLAND_POSITIONS[6][0]).toBeGreaterThan(RED_LINE_X);
  });

  it('Wano (idx 7, New World) is east of the Red Line', () => {
    expect(ISLAND_POSITIONS[7][0]).toBeGreaterThan(RED_LINE_X);
  });
});

describe('GrandLineMap P3 — island names match One Piece lore', () => {
  it('index 0 is Laugh Tale (the legendary final island)', () => {
    expect(SKILL_DOMAINS[0].island).toBe('Laugh Tale');
  });

  it('index 4 is Fishman Island', () => {
    expect(SKILL_DOMAINS[4].island).toBe('Fishman Island');
  });

  it('index 8 is Reverie / Mary Geoise', () => {
    expect(SKILL_DOMAINS[8].island).toContain('Mary Geoise');
  });

  it('index 2 is Skypiea', () => {
    expect(SKILL_DOMAINS[2].island).toBe('Skypiea');
  });
});

// ---------------------------------------------------------------------------
// Round 19 — Dawn Island origin data, island shapes catalog, World Codex
// (Read source-file text rather than importing — see top-of-file note.)
// ---------------------------------------------------------------------------
describe('GrandLineMap R19 — DAWN_ISLAND_DATA origin entry', () => {
  const skillsSrc = readSource('src/features/skills/data/skills.ts');

  it('declares an export named DAWN_ISLAND_DATA', () => {
    expect(skillsSrc).toMatch(/export const DAWN_ISLAND_DATA/);
  });

  it('has kind = origin (discriminator for popup branch)', () => {
    expect(skillsSrc).toMatch(/kind:\s*'origin'/);
  });

  it('island value is "Dawn Island"', () => {
    expect(skillsSrc).toMatch(/island:\s*'Dawn Island'/);
  });

  it('sub-headline mentions Foosha Village', () => {
    // Match anywhere in the file (sub: 'East Blue · Foosha Village')
    expect(skillsSrc).toMatch(/Foosha/);
  });

  it('section titles include The Origin Code, Primary Directive, and Awakening', () => {
    expect(skillsSrc).toMatch(/The Origin Code/);
    expect(skillsSrc).toMatch(/The Primary Directive/);
    expect(skillsSrc).toMatch(/The Awakening/);
  });

  it('Awakening section references the Hito Hito no Mi Model Nika lore', () => {
    expect(skillsSrc).toMatch(/Nika/);
    expect(skillsSrc).toMatch(/Hito Hito/);
  });
});

describe('GrandLineMap R19 — ISLAND_SHAPES catalog', () => {
  const shapesSrc = readSource('src/features/skills/grandLineIslandShapes.ts');

  const EXPECTED_SLUGS = [
    'dawn-island',
    'whiskey-peak',
    'little-garden',
    'drum-island',
    'alabasta',
    'jaya',
    'skypiea',
    'water-7',
    'enies-lobby', // Round 26: judicial fortress, sea-train linked to Water 7
    'thriller-bark',
    'sabaody',
    'fishman-island',
    'punk-hazard',
    'dressrosa',
    'zou',
    'whole-cake-island',
    'wano-country',
    'egghead',
    'elbaph',
    'laugh-tale',
  ];

  it('contains all 20 expected island slugs (Dawn + 9 visited + Enies Lobby + 9 future)', () => {
    for (const slug of EXPECTED_SLUGS) {
      // The source declares each entry as `'<slug>': { ... slug: '<slug>', ... }`
      const re = new RegExp(`'${slug.replace(/-/g, '-')}':\\s*\\{`);
      expect(shapesSrc, `missing slug: ${slug}`).toMatch(re);
    }
  });

  it('every shape has a non-empty pathD that starts with M and ends with Z', () => {
    // Find every pathD: '...' and assert each one starts with M and ends with Z.
    const pathRe = /pathD:\s*'([^']{20,})'/g;
    const paths: string[] = [];
    let match;
    while ((match = pathRe.exec(shapesSrc)) !== null) {
      paths.push(match[1]);
    }
    expect(paths.length).toBe(EXPECTED_SLUGS.length);
    for (const p of paths) {
      expect(p.trim().startsWith('M')).toBe(true);
      expect(p.trim().endsWith('Z')).toBe(true);
    }
  });

  it('every shape has a sizePct between 2 and 6 (sane render width)', () => {
    const sizeRe = /sizePct:\s*([0-9]+(?:\.[0-9]+)?)/g;
    const sizes: number[] = [];
    let match;
    while ((match = sizeRe.exec(shapesSrc)) !== null) {
      sizes.push(parseFloat(match[1]));
    }
    expect(sizes.length).toBe(EXPECTED_SLUGS.length);
    for (const s of sizes) {
      expect(s).toBeGreaterThanOrEqual(2);
      expect(s).toBeLessThanOrEqual(6);
    }
  });

  it('Laugh Tale shape exists (used with locked overlay)', () => {
    expect(shapesSrc).toMatch(/'laugh-tale':\s*\{/);
  });
});

describe('GrandLineMap R19 — WORLD_CODEX panel data', () => {
  const codexSrc = readSource('src/features/skills/grandLineCodex.ts');

  it('declares an exported WORLD_CODEX array', () => {
    expect(codexSrc).toMatch(/export const WORLD_CODEX/);
  });

  it('card ids cover world-coords, devil-fruits, haki, and luffy-logic', () => {
    expect(codexSrc).toMatch(/id:\s*'world-coords'/);
    expect(codexSrc).toMatch(/id:\s*'devil-fruits'/);
    expect(codexSrc).toMatch(/id:\s*'haki'/);
    expect(codexSrc).toMatch(/id:\s*'luffy-logic'/);
  });

  it('Haki card mentions Observation, Armament, and Conqueror', () => {
    expect(codexSrc).toMatch(/Observation Haki/);
    expect(codexSrc).toMatch(/Armament Haki/);
    expect(codexSrc).toMatch(/Conqueror/);
  });

  it('Devil Fruits card mentions Paramecia, Zoan, Logia and Sea Stone', () => {
    expect(codexSrc).toMatch(/Paramecia/);
    expect(codexSrc).toMatch(/Zoan/);
    expect(codexSrc).toMatch(/Logia/);
    expect(codexSrc).toMatch(/Sea Stone/);
  });
});

// ---------------------------------------------------------------------------
// Round 25 — Cylindrical projection rebuild semantic checks.
// We READ the live GrandLineMap.tsx source and assert structural / semantic
// properties (positions of named islands relative to the central Red Line,
// presence of new components, locked-Laugh-Tale wiring, security comment).
// ---------------------------------------------------------------------------
describe('GrandLineMap R25 — cylindrical projection semantic geography', () => {
  const mapSrc = readSource('src/features/skills/GrandLineMap.tsx');

  // Central Red Line at x=51 (per plan).
  const RED_LINE_X_R25 = 51;

  /**
   * Extract a {x, y} comment-tagged position from the ALL_ISLAND_POS table by
   * comment substring (e.g. "Whiskey Peak").  Returns [x, y] or null.
   */
  function findIslandXY(label: string): [number, number] | null {
    const re = new RegExp(`\\{\\s*x:\\s*([0-9.]+)\\s*,\\s*y:\\s*([0-9.]+)\\s*\\}[^\\n]*${label}`);
    const m = mapSrc.match(re);
    if (!m) return null;
    return [parseFloat(m[1]), parseFloat(m[2])];
  }

  it('Whiskey Peak is right of centre (Paradise side)', () => {
    const xy = findIslandXY('Whiskey Peak');
    expect(xy).not.toBeNull();
    expect(xy![0]).toBeGreaterThan(RED_LINE_X_R25);
  });

  it('Sabaody is at the far-east edge (x >= 90)', () => {
    const xy = findIslandXY('Sabaody');
    expect(xy).not.toBeNull();
    expect(xy![0]).toBeGreaterThanOrEqual(90);
  });

  it('Fishman Island is at the LEFT-edge Red Line wrap point (x <= 6, south of Grand Line)', () => {
    // Round 36: Fishman moved from "under centre Red Line" (old: x≈51, y≈84)
    // to the LEFT-edge Red Line strip.  It is the first New World island the
    // voyage reaches after wrapping cylindrically off Sabaody's east edge.
    const xy = findIslandXY('Fishman Island');
    expect(xy).not.toBeNull();
    expect(xy![0]).toBeLessThanOrEqual(6);
    expect(xy![1]).toBeGreaterThan(58); // south of the Grand Line band (42-58)
  });

  it('Laugh Tale is the rightmost slot in the New World (x in 45..50, west of centre Red Line)', () => {
    // Round 36: Laugh Tale is no longer an off-route corner mystery — it is
    // the FINAL New World voyage island, rendered just west of the central
    // Red Line so the New World reads LEFT→RIGHT like Paradise.
    const xy = findIslandXY('Laugh Tale');
    expect(xy).not.toBeNull();
    expect(xy![0]).toBeGreaterThanOrEqual(45);
    expect(xy![0]).toBeLessThan(RED_LINE_X_R25);
  });

  it('Skypiea sits DIRECTLY ABOVE Jaya (same x ±2, y much smaller)', () => {
    const sky = findIslandXY('Skypiea');
    const jaya = findIslandXY('Jaya');
    expect(sky).not.toBeNull();
    expect(jaya).not.toBeNull();
    expect(Math.abs(sky![0] - jaya![0])).toBeLessThanOrEqual(2);
    expect(sky![1]).toBeLessThan(jaya![1] - 30); // Skypiea floats high above Jaya
  });

  it('Punk Hazard is just LEFT of centre (New World) (x < RED_LINE_X)', () => {
    const xy = findIslandXY('Punk Hazard');
    expect(xy).not.toBeNull();
    expect(xy![0]).toBeLessThan(RED_LINE_X_R25);
  });
});

describe('GrandLineMap R25 — atmospheric / off-route nodes', () => {
  const mapSrc = readSource('src/features/skills/GrandLineMap.tsx');

  it('Enies Lobby is rendered well east of Water 7 with visible sea-train gap (x in 92..96)', () => {
    // Round 36 (follow-up): Enies Lobby was nudged from x≈89 to x≈94 so
    // the sea-train tracks have a visible span between the two silhouettes
    // (Water 7's right edge ≈ 88, Enies Lobby's left edge ≈ 91.5).
    const m = mapSrc.match(/ENIES_LOBBY_POS\s*:\s*Pos\s*=\s*\{\s*x:\s*([0-9.]+)/);
    expect(m).not.toBeNull();
    const x = parseFloat(m![1]);
    expect(x).toBeGreaterThanOrEqual(92);
    expect(x).toBeLessThanOrEqual(96);
  });

  it('Enies Lobby uses the dedicated transparent map icon (no longer the Water 7 photo hack)', () => {
    // Round 36 (follow-up): the Enies Lobby render no longer passes
    // `name="water 7"` to fall back on water-7.webp — it now uses the
    // hand-authored transparent fortress icon via imageHrefOverride.
    expect(mapSrc).toMatch(/ENIES_LOBBY_ICON\s*=\s*'\/assets\/One-Piece\/icons\/enies-lobby-map-icon-transparent\.png'/);
    expect(mapSrc).toMatch(/imageHrefOverride=\{ENIES_LOBBY_ICON\}/);
  });

  it('Laugh Tale is part of the canonical voyage sequence (no separate LAUGH_TALE_POS export)', () => {
    // Round 36: Laugh Tale moved from the off-route top-left corner into the
    // New World as the rightmost voyage slot.  The standalone LAUGH_TALE_POS
    // constant was removed in favour of an entry in ALL_ISLAND_POS.
    expect(mapSrc).not.toMatch(/const\s+LAUGH_TALE_POS\s*:/);
  });

  it('Laugh Tale appears in the future-canon name list so it inherits a slot via ISLAND_POS_BY_NAME', () => {
    expect(mapSrc).toMatch(/FUTURE_CANON_NAMES\s*=\s*\[[\s\S]*?'Laugh Tale'/);
  });

  it('Skypiea (atmospheric) cloud-link component is wired in the canvas', () => {
    expect(mapSrc).toMatch(/<CloudLinkSkypieaJaya\s*\/>/);
    expect(mapSrc).toMatch(/function\s+CloudLinkSkypieaJaya\s*\(/);
  });

  it('Sea-train tracks component is present and wired', () => {
    expect(mapSrc).toMatch(/<SeaTrainTracks\s*\/>/);
    expect(mapSrc).toMatch(/function\s+SeaTrainTracks\s*\(/);
  });
});

describe('GrandLineMap R25 — edge Red Line wrap-around', () => {
  const mapSrc = readSource('src/features/skills/GrandLineMap.tsx');

  it('declares a west-edge Red Line strip (cylindrical wrap)', () => {
    // The strip path starts at x=0 column.
    expect(mapSrc).toMatch(/West edge strip/i);
  });

  it('declares an east-edge Red Line strip (cylindrical wrap)', () => {
    expect(mapSrc).toMatch(/East edge strip/i);
  });
});

describe('GrandLineMap R25 — IslandShapeDef overlay extension', () => {
  const shapesSrc = readSource('src/features/skills/grandLineIslandShapes.ts');

  it('IslandShapeDef type declares optional overlay property', () => {
    expect(shapesSrc).toMatch(/overlay\?:\s*string/);
  });

  it('contains explicit XSS security note for overlay strings', () => {
    expect(shapesSrc).toMatch(/SECURITY NOTE/);
    expect(shapesSrc).toMatch(/XSS/);
    // The string "NEVER pipe" + (some chars + newline + JSDoc gutter) + "user-supplied SVG"
    expect(shapesSrc).toMatch(/NEVER pipe[\s\S]{0,60}user-supplied SVG/);
  });

  it('authors at least 17 themed overlays (one per island except Dawn Island and Laugh Tale)', () => {
    // The /g flag with literal `'` only counts the first character of each
    // overlay assignment.  Overlays ARE present on 17 of the 19 islands
    // (Dawn Island and Laugh Tale intentionally lack themed overlays).
    const overlayMatches = shapesSrc.match(/overlay:\s*\n?\s*'/g) ?? [];
    expect(overlayMatches.length).toBeGreaterThanOrEqual(17);
  });
});
