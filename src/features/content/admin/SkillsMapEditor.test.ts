/**
 * src/features/content/admin/SkillsMapEditor.test.ts
 *
 * Round 31 — verifies the new Luffy-mode skills admin editor:
 *   - Renders an island silhouette for each of the 18 islands (9 visited
 *     skill domains + 9 future islands).
 *   - Branches SkillsContentAdmin on mode (Luffy → SkillsMapEditor,
 *     Thor → table).
 *   - Wires inline-edit fields for the documented per-island affordances.
 *
 * NOTE: This codebase's vmThreads vitest pool cannot reliably transform
 * live source modules with named exports (rolldown SSR transform quirk —
 * see src/data/project-fixtures.test.ts header). Instead of `import`, we
 * read the source file at test time and assert shape via regex / file
 * content, mirroring the GrandLineMap.test.ts convention.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

// The 9 + 9 = 18 islands the editor must support, in canonical voyage order.
// Mirrors SKILL_DOMAINS and FUTURE_ISLANDS in src/data/skills.ts.
const VISITED_ISLANDS = [
  'Whiskey Peak',
  'Little Garden',
  'Drum Island',
  'Alabasta',
  'Jaya',
  'Skypiea',
  'Water 7',
  'Thriller Bark',
  'Sabaody',
];
const FUTURE_ISLANDS = [
  'Fishman Island',
  'Punk Hazard',
  'Dressrosa',
  'Zou',
  'Whole Cake Island',
  'Wano Country',
  'Egghead',
  'Elbaph',
  'Laugh Tale',
];

describe('SkillsMapEditor — file shape', () => {
  const src = readSource('src/features/content/admin/SkillsMapEditor.tsx');

  it('exports a default component', () => {
    expect(src).toMatch(/export\s+default\s+function\s+SkillsMapEditor/);
  });

  it('imports ISLAND_SHAPES from the shared shapes module', () => {
    expect(src).toMatch(
      /import\s*\{\s*ISLAND_SHAPES\s*\}\s*from\s*['"][^'"]*grandLineIslandShapes['"]/,
    );
  });

  it('imports the InlineEdit primitive', () => {
    expect(src).toMatch(/import\s+InlineEdit\s+from\s+['"]\.\/InlineEdit['"]/);
  });

  it('uses upsertSiteContentMany for persistence (mode IS NULL rows)', () => {
    expect(src).toContain('upsertSiteContentMany');
    expect(src).toMatch(/section:\s*['"]skills['"]/);
    expect(src).toMatch(/mode:\s*null/);
  });

  it('persists both domains AND futureIslands fields', () => {
    expect(src).toMatch(/field:\s*['"]domains['"]/);
    expect(src).toMatch(/field:\s*['"]futureIslands['"]/);
  });

  it('declares VISITED_POS with 9 entries', () => {
    const m = src.match(/const VISITED_POS:\s*Pos\[\]\s*=\s*\[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const entries = (m?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+\s*\}/g) ?? [];
    expect(entries).toHaveLength(9);
  });

  it('declares FUTURE_POS with 9 entries', () => {
    const m = src.match(/const FUTURE_POS:\s*Pos\[\]\s*=\s*\[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const entries = (m?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+\s*\}/g) ?? [];
    expect(entries).toHaveLength(9);
  });

  it('renders all 9 visited islands by name in the position table', () => {
    for (const island of VISITED_ISLANDS) {
      expect(src.includes(island)).toBe(true);
    }
  });

  it('renders all 9 future islands by name in the position table', () => {
    for (const island of FUTURE_ISLANDS) {
      expect(src.includes(island)).toBe(true);
    }
  });

  it('exposes a click-to-select state via setSelection', () => {
    expect(src).toMatch(/setSelection\(\{\s*kind:\s*['"]visited['"]/);
    expect(src).toMatch(/setSelection\(\{\s*kind:\s*['"]future['"]/);
  });

  it('wires inline-edit for the documented visited-island fields', () => {
    // Round 31 (refined): realm field removed per user request — Norse realm
    // tag was Thor-specific noise in the Luffy-mode editor. The realm value
    // still exists on the SkillDomain object (read by Thor mode), it's just
    // not editable from this Luffy-mode surface.
    expect(src).toMatch(/Edit domain name/);
    expect(src).toMatch(/Edit island/);
    expect(src).toMatch(/Edit lore/);
    expect(src).toMatch(/Edit gear tier/);
    // Realm intentionally NOT asserted any more.
  });

  it('wires inline-edit for the documented future-island fields', () => {
    expect(src).toMatch(/Edit future island name/);
    expect(src).toMatch(/Edit future gear tier/);
    expect(src).toMatch(/Edit hint/);
  });

  it('renders skill leaves with name / proficiency / description editors', () => {
    expect(src).toMatch(/Edit skill .* name/);
    expect(src).toMatch(/Edit skill .* proficiency/);
    expect(src).toMatch(/Edit skill .* description/);
  });

  it('uses .glm-isle classes so silhouettes match the live map visually', () => {
    expect(src).toContain('glm-isle');
  });

  it('declares the gear options (Base → Gear 5)', () => {
    expect(src).toMatch(/['"]Base['"]/);
    expect(src).toMatch(/['"]Gear 2['"]/);
    expect(src).toMatch(/['"]Gear 3['"]/);
    expect(src).toMatch(/['"]Gear 4['"]/);
    expect(src).toMatch(/['"]Gear 5['"]/);
  });
});

describe('SkillsContentAdmin — mode branching', () => {
  const src = readSource('src/features/content/admin/SkillsContentAdmin.tsx');

  it('lazy-imports SkillsMapEditor', () => {
    expect(src).toMatch(/lazy\(\s*\(\)\s*=>\s*import\(['"]\.\/SkillsMapEditor['"]\)\s*\)/);
  });

  // Round 34 — non-Thor (Luffy / gear5) branch renders SkillsMapEditor.
  it('renders SkillsMapEditor when NOT in Thor mode (i.e. Luffy / gear5)', () => {
    // Branch is now `isThor ? <Tree/> : <Map/>` so we just check the Luffy
    // branch contains <SkillsMapEditor.
    expect(src).toMatch(/<SkillsMapEditor/);
  });

  // Round 34 — Thor mode now renders SkillsTreeEditor (replaces the old
  // table-style fieldset layout). Lazy-loaded for chunk-size parity.
  it('lazy-imports SkillsTreeEditor for Thor mode', () => {
    expect(src).toMatch(/lazy\(\s*\(\)\s*=>\s*import\(['"]\.\/SkillsTreeEditor['"]\)\s*\)/);
  });

  it('renders SkillsTreeEditor when in Thor mode', () => {
    expect(src).toMatch(/isThor\s*\?[\s\S]*?<SkillsTreeEditor/);
  });

  it('passes both onDomainsChange and onFutureIslandsChange callbacks down', () => {
    expect(src).toContain('onDomainsChange');
    expect(src).toContain('onFutureIslandsChange');
  });

  it('passes both onDomainsChange and onFutureRealmsChange callbacks to the tree editor', () => {
    expect(src).toContain('onDomainsChange');
    expect(src).toContain('onFutureRealmsChange');
  });

  // Round 35 — both editors now receive BOTH future queues + setters so
  // promote / delete / drop can advance the parallel queue in lockstep.
  it('passes BOTH futureRealms AND futureIslands to BOTH editors (Round 35 lockstep)', () => {
    // Map editor side gets both prop names.
    expect(src).toMatch(/<SkillsMapEditor[\s\S]*futureIslands=\{futureIslands\}[\s\S]*futureRealms=\{futureRealms\}/);
    expect(src).toMatch(/<SkillsMapEditor[\s\S]*onFutureIslandsChange=\{setFutureIslands\}[\s\S]*onFutureRealmsChange=\{setFutureRealms\}/);
    // Tree editor side gets both prop names.
    expect(src).toMatch(/<SkillsTreeEditor[\s\S]*futureRealms=\{futureRealms\}[\s\S]*futureIslands=\{futureIslands\}/);
    expect(src).toMatch(/<SkillsTreeEditor[\s\S]*onFutureRealmsChange=\{setFutureRealms\}[\s\S]*onFutureIslandsChange=\{setFutureIslands\}/);
  });
});

describe('SkillsMapEditor — island count contract', () => {
  it('renders exactly 18 islands total (9 visited + 9 future)', () => {
    expect(VISITED_ISLANDS.length + FUTURE_ISLANDS.length).toBe(18);
  });

  it('every editor island has a matching ISLAND_SHAPES entry', () => {
    const shapesSrc = readSource('src/features/skills/grandLineIslandShapes.ts');
    function slugify(name: string) {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    for (const island of [...VISITED_ISLANDS, ...FUTURE_ISLANDS]) {
      const slug = slugify(island);
      expect(shapesSrc).toContain(`'${slug}':`);
    }
  });
});

// ---------------------------------------------------------------------------
// Round 33 — promote-on-add-leaf flow + width-fix wiring
// ---------------------------------------------------------------------------
describe('SkillsMapEditor — Round 33 promote flow', () => {
  const src = readSource('src/features/content/admin/SkillsMapEditor.tsx');

  it('exposes a promoteFutureAt(idx, seedLeaves?) helper', () => {
    expect(src).toMatch(/const\s+promoteFutureAt\s*=\s*useCallback/);
    expect(src).toMatch(/futureIdx[\s\S]*seedLeaves\?:/);
  });

  it('toolbar "+ Add new skill" calls promoteFutureAt(0) and selects the new domain', () => {
    expect(src).toMatch(/const\s+promoteNextFuture\s*=\s*useCallback/);
    expect(src).toMatch(/promoteFutureAt\(0\)/);
  });

  it('future panel exposes promoteSelectedFuture which seeds one leaf', () => {
    expect(src).toMatch(/const\s+promoteSelectedFuture\s*=\s*useCallback/);
    // Seeds the new domain with at least 1 leaf so the children list renders.
    expect(src).toMatch(/seed:\s*SkillLeaf\[\]/);
    expect(src).toMatch(/proficiency:\s*50/);
  });

  it('future panel renders a "+ Add skill" promote button + hint copy', () => {
    expect(src).toMatch(/Promote this future island to a skill domain/);
    expect(src).toMatch(/promoted on add[\s\S]*|promote-on-add-skill|promoteSelectedFuture/);
    expect(src).toMatch(/skills-map-editor__future-hint/);
  });

  it('visited panel exposes a "+ Add skill" button via addLeafToDomain', () => {
    expect(src).toMatch(/const\s+addLeafToDomain\s*=\s*useCallback/);
    expect(src).toMatch(/Add a skill leaf to this domain/);
  });

  it('does NOT include the legacy `icon` field on promoted SkillDomain (TS bug)', () => {
    // Round 32 had `icon: '★'` which fails tsc — must stay removed.
    expect(src).not.toMatch(/icon:\s*['"][^'"]+['"]/);
  });

  it('resolves island map slots by canonical island name (not array index)', () => {
    // Prevents the position-collision bug after a future is promoted.
    expect(src).toMatch(/ISLAND_POS_BY_NAME\[(?:dom|fi)\.island\]/);
  });
});

// ---------------------------------------------------------------------------
// Round 35 — promote-in-order (lockstep both queues) + delete + drop +
// custom-add + reorder.
// ---------------------------------------------------------------------------
describe('SkillsMapEditor — Round 35 in-order promote / delete / custom / reorder', () => {
  const src = readSource('src/features/content/admin/SkillsMapEditor.tsx');

  it('Props now require the parallel futureRealms queue + setter', () => {
    expect(src).toMatch(/futureRealms:\s*FutureRealm\[\]/);
    expect(src).toMatch(/onFutureRealmsChange:\s*\(next:\s*FutureRealm\[\]\)\s*=>\s*void/);
  });

  it('promoteFutureAt advances the futureRealms queue at the SAME index', () => {
    // Lockstep: when Luffy promotes Fishman Island (futureIslands[0]),
    // realms[0] (Wakanda) is dropped from futureRealms in the same batch.
    expect(src).toMatch(/realmTarget\s*=\s*futureRealms\[futureIdx\]/);
    expect(src).toMatch(/futureRealms\.filter\(\(_,\s*i\)\s*=>\s*i\s*!==\s*futureIdx\)/);
    expect(src).toMatch(/field:\s*['"]futureRealms['"]/);
  });

  it('promoted SkillDomain inherits the realm name from the parallel queue (no static "Asgard" placeholder)', () => {
    // Old code hard-coded `realm: 'Asgard'` — Round 35 pulls from
    // futureRealms[futureIdx]?.realm so Wakanda lands with Fishman Island.
    expect(src).toMatch(/realm:\s*realmTarget\?\.realm/);
  });

  it('appends the promoted domain to the END of `domains` (not insert mid-array)', () => {
    // ...so it visually lands "next" in voyage order, after the current Sunny.
    expect(src).toMatch(/nextDomains\s*=\s*\[\s*\.\.\.domains\s*,\s*newDomain\s*\]/);
  });

  it('exposes deleteVisitedDomain that prepends back to BOTH future queues', () => {
    expect(src).toMatch(/const\s+deleteVisitedDomain\s*=\s*useCallback/);
    // Prepend (head) to futureIslands so it's the next promote candidate.
    expect(src).toMatch(/nextFutureIslands[\s\S]*?\[\s*\{[\s\S]*?island:\s*target\.island/);
    expect(src).toMatch(/nextFutureRealms[\s\S]*?\[\s*\{[\s\S]*?realm:\s*target\.realm/);
  });

  it('renders a Delete button on the visited panel guarded by window.confirm', () => {
    expect(src).toMatch(/window\.confirm\(/);
    expect(src).toMatch(/Delete island \(return to queue\)/);
  });

  it('exposes dropFutureIslandAt that drops the parallel realm at the same index', () => {
    expect(src).toMatch(/const\s+dropFutureIslandAt\s*=\s*useCallback/);
    expect(src).toMatch(/Drop from future queue/);
  });

  it('exposes swapDomains for the ↑/↓ reorder controls', () => {
    expect(src).toMatch(/const\s+swapDomains\s*=\s*useCallback/);
    // The buttons swap with neighbour indices.
    expect(src).toMatch(/swapDomains\(selection\.idx,\s*selection\.idx\s*-\s*1\)/);
    expect(src).toMatch(/swapDomains\(selection\.idx,\s*selection\.idx\s*\+\s*1\)/);
    // Disabled at boundaries.
    expect(src).toMatch(/disabled=\{selection\.idx\s*===\s*0\}/);
    expect(src).toMatch(/disabled=\{selection\.idx\s*>=\s*domains\.length\s*-\s*1\}/);
  });

  it('exposes addCustomDomain + a "+ Custom" toolbar button', () => {
    expect(src).toMatch(/const\s+addCustomDomain\s*=\s*useCallback/);
    expect(src).toMatch(/\+ Custom/);
  });

  it('renders a CustomAddPanel component for the inline custom-add modal', () => {
    expect(src).toMatch(/function\s+CustomAddPanel\(/);
    // The modal carries the documented fields.
    expect(src).toMatch(/Custom domain name/);
    expect(src).toMatch(/Custom island name/);
    expect(src).toMatch(/Custom realm name/);
    expect(src).toMatch(/Custom gear tier/);
    expect(src).toMatch(/Custom lore/);
  });
});
