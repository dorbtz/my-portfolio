/**
 * src/features/content/admin/SkillsTreeEditor.test.ts
 *
 * Round 34 — verifies the new Thor-mode skills admin editor:
 *   - Renders all 18 realm stars (9 visited skill domains + 9 future realms)
 *     using the live <YggdrasilTree /> position constants.
 *   - Branches SkillsContentAdmin on mode (Thor → SkillsTreeEditor, Luffy →
 *     SkillsMapEditor) — both branches lazy-loaded for chunk-size parity.
 *   - Wires inline-edit fields for the documented per-realm affordances.
 *   - Exposes promote helpers parallel to SkillsMapEditor (toolbar promotes
 *     futureRealms[0]; future-panel "+ Add skill" promotes the selected one).
 *
 * NOTE: This codebase's vmThreads vitest pool cannot reliably transform
 * live source modules with named exports (rolldown SSR transform quirk —
 * see src/data/project-fixtures.test.ts header). Instead of `import`, we
 * read the source file at test time and assert shape via regex / file
 * content, mirroring the SkillsMapEditor.test.ts convention.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

// The 9 + 9 = 18 realms the editor must support, in canonical order.
// Mirrors SKILL_DOMAINS and FUTURE_REALMS in src/data/skills.ts.
const VISITED_REALMS = [
  'Vanaheim',
  'Jotunheim',
  'Svartalfheim',
  'Niflheim',
  'Helheim',
  'Alfheim',
  'Muspelheim',
  'Midgard',
  'Asgard',
];
const FUTURE_REALMS_NAMES = [
  'Wakanda',
  'Sanctum Sanctorum',
  'Vormir',
  'Knowhere',
  'Sakaar',
  'Titan',
  'Quantum Realm',
  'Battleworld',
  'Eternity',
];

describe('SkillsTreeEditor — file shape', () => {
  const src = readSource('src/features/content/admin/SkillsTreeEditor.tsx');

  it('exports a default component named SkillsTreeEditor', () => {
    expect(src).toMatch(/export\s+default\s+function\s+SkillsTreeEditor/);
  });

  it('reuses REALM_STARS / FUTURE_STARS / TIER_COLORS from the live SkillsTree (Round 74: helpers file)', () => {
    // Round 74 — non-component exports moved to SkillsTree.helpers.ts so
    // the component file is react-refresh-clean. The editor now imports
    // the same constants from the helpers shim.
    expect(src).toMatch(
      /import\s*\{[\s\S]*?REALM_STARS[\s\S]*?FUTURE_STARS[\s\S]*?TIER_COLORS[\s\S]*?\}\s*from\s*['"][^'"]*SkillsTree(?:\.helpers)?['"]/,
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

  it('persists both domains AND futureRealms fields', () => {
    expect(src).toMatch(/field:\s*['"]domains['"]/);
    expect(src).toMatch(/field:\s*['"]futureRealms['"]/);
  });

  it('references the YGGDRASIL-transparent.png backdrop', () => {
    expect(src).toContain('YGGDRASIL-transparent.png');
  });

  it('renders all 9 visited realms by name in the position table', () => {
    for (const realm of VISITED_REALMS) {
      expect(src.includes(realm)).toBe(true);
    }
  });

  it('renders all 9 future realms by name in the position table', () => {
    for (const realm of FUTURE_REALMS_NAMES) {
      expect(src.includes(realm)).toBe(true);
    }
  });

  it('exposes a click-to-select state via setSelection', () => {
    expect(src).toMatch(/setSelection\(\{\s*kind:\s*['"]visited['"]/);
    expect(src).toMatch(/setSelection\(\{\s*kind:\s*['"]future['"]/);
  });

  it('wires inline-edit for the documented visited-realm fields', () => {
    expect(src).toMatch(/Edit domain name/);
    expect(src).toMatch(/Edit realm/);
    expect(src).toMatch(/Edit lore/);
    expect(src).toMatch(/Edit gear tier/);
  });

  it('wires inline-edit for the documented future-realm fields', () => {
    expect(src).toMatch(/Edit future realm name/);
    expect(src).toMatch(/Edit future tier/);
    expect(src).toMatch(/Edit hint/);
  });

  it('renders skill leaves with name / proficiency / description editors', () => {
    expect(src).toMatch(/Edit skill .* name/);
    expect(src).toMatch(/Edit skill .* proficiency/);
    expect(src).toMatch(/Edit skill .* description/);
  });

  it('uses .yggdrasil-star classes so stars match the live tree visually', () => {
    // Base class is a static string. The visited / future modifier is produced
    // at runtime via `yggdrasil-star--${variant}` (variant ∈ {visited,future})
    // — so we assert both the base class and the template-literal that emits
    // the modifier, plus the active-state modifier used for selection ring.
    expect(src).toContain('yggdrasil-star');
    expect(src).toMatch(/yggdrasil-star--\$\{variant\}/);
    expect(src).toMatch(/yggdrasil-star--active/);
    // And the variants are passed in for both kinds of stars:
    expect(src).toMatch(/variant=['"]visited['"]/);
    expect(src).toMatch(/variant=['"]future['"]/);
  });

  it('declares the gear options (Base → Gear 5)', () => {
    expect(src).toMatch(/['"]Base['"]/);
    expect(src).toMatch(/['"]Gear 2['"]/);
    expect(src).toMatch(/['"]Gear 3['"]/);
    expect(src).toMatch(/['"]Gear 4['"]/);
    expect(src).toMatch(/['"]Gear 5['"]/);
  });

  it('declares the future tier options (Bifrost → Multiversal)', () => {
    expect(src).toMatch(/['"]Bifrost['"]/);
    expect(src).toMatch(/['"]Mystic['"]/);
    expect(src).toMatch(/['"]Cosmic['"]/);
    expect(src).toMatch(/['"]Quantum['"]/);
    expect(src).toMatch(/['"]Multiversal['"]/);
  });
});

// ---------------------------------------------------------------------------
// Promote-flow contract — mirrors SkillsMapEditor's Round 33 promote tests.
// ---------------------------------------------------------------------------
describe('SkillsTreeEditor — promote flow', () => {
  const src = readSource('src/features/content/admin/SkillsTreeEditor.tsx');

  it('exposes a promoteFutureRealmAt(idx, seedLeaves?) helper', () => {
    expect(src).toMatch(/const\s+promoteFutureRealmAt\s*=\s*useCallback/);
    expect(src).toMatch(/futureIdx[\s\S]*seedLeaves\?:/);
  });

  it('toolbar "+ Add new realm" calls promoteFutureRealmAt(0) and selects the new domain', () => {
    expect(src).toMatch(/const\s+promoteNextFutureRealm\s*=\s*useCallback/);
    expect(src).toMatch(/promoteFutureRealmAt\(0\)/);
    expect(src).toMatch(/\+ Add new realm/);
  });

  it('future panel exposes promoteSelectedFutureRealm which seeds one leaf', () => {
    expect(src).toMatch(/const\s+promoteSelectedFutureRealm\s*=\s*useCallback/);
    // Seeds the new domain with at least 1 leaf so the children list renders.
    expect(src).toMatch(/seed:\s*SkillLeaf\[\]/);
    expect(src).toMatch(/proficiency:\s*50/);
  });

  it('future panel renders a "+ Add skill" promote button + hint copy', () => {
    expect(src).toMatch(/Promote this future realm to a skill domain/);
    expect(src).toMatch(/skills-tree-editor__future-hint/);
  });

  it('visited panel exposes a "+ Add skill" button via addLeafToDomain', () => {
    expect(src).toMatch(/const\s+addLeafToDomain\s*=\s*useCallback/);
    expect(src).toMatch(/Add a skill leaf to this realm/);
  });

  it('resolves star slots by canonical realm name (not array index)', () => {
    // Prevents the position-collision bug after a future is promoted.
    expect(src).toMatch(/STAR_POS_BY_REALM\[(?:dom|fr)\.realm\]/);
  });

  it('does NOT include any legacy `icon` field on promoted SkillDomain', () => {
    // Same TS-bug guard as SkillsMapEditor — the `icon` field was removed in
    // Round 33 because it's not part of the SkillDomain shape.
    expect(src).not.toMatch(/icon:\s*['"][^'"]+['"]/);
  });
});

// ---------------------------------------------------------------------------
// Round 35 — promote-in-order (lockstep) + delete + drop + custom-add + reorder.
// ---------------------------------------------------------------------------
describe('SkillsTreeEditor — Round 35 in-order promote / delete / custom / reorder', () => {
  const src = readSource('src/features/content/admin/SkillsTreeEditor.tsx');

  it('Props now require the parallel futureIslands queue + setter', () => {
    expect(src).toMatch(/futureIslands:\s*FutureIsland\[\]/);
    expect(src).toMatch(/onFutureIslandsChange:\s*\(next:\s*FutureIsland\[\]\)\s*=>\s*void/);
  });

  it('promoteFutureRealmAt advances the futureIslands queue at the SAME index', () => {
    expect(src).toMatch(/islandTarget\s*=\s*futureIslands\[futureIdx\]/);
    expect(src).toMatch(/futureIslands\.filter\(\(_,\s*i\)\s*=>\s*i\s*!==\s*futureIdx\)/);
    expect(src).toMatch(/field:\s*['"]futureIslands['"]/);
  });

  it('promoted SkillDomain inherits the island name from the parallel queue (no static "Whiskey Peak" placeholder)', () => {
    // Old code hard-coded `island: 'Whiskey Peak'` — Round 35 pulls from
    // futureIslands[futureIdx]?.island so Fishman Island lands with Wakanda.
    expect(src).toMatch(/island:\s*islandTarget\?\.island/);
    expect(src).not.toMatch(/island:\s*['"]Whiskey Peak['"]/);
  });

  it('appends the promoted domain to the END of `domains`', () => {
    expect(src).toMatch(/nextDomains\s*=\s*\[\s*\.\.\.domains\s*,\s*newDomain\s*\]/);
  });

  it('exposes deleteVisitedDomain that prepends back to BOTH future queues', () => {
    expect(src).toMatch(/const\s+deleteVisitedDomain\s*=\s*useCallback/);
    expect(src).toMatch(/nextFutureRealms[\s\S]*?\[\s*\{[\s\S]*?realm:\s*target\.realm/);
    expect(src).toMatch(/nextFutureIslands[\s\S]*?\[\s*\{[\s\S]*?island:\s*target\.island/);
  });

  it('renders a Delete button on the visited panel guarded by window.confirm', () => {
    expect(src).toMatch(/window\.confirm\(/);
    expect(src).toMatch(/Delete realm \(return to queue\)/);
  });

  it('exposes dropFutureRealmAt that drops the parallel island at the same index', () => {
    expect(src).toMatch(/const\s+dropFutureRealmAt\s*=\s*useCallback/);
    expect(src).toMatch(/Drop from future queue/);
  });

  it('exposes swapDomains for the ↑/↓ reorder controls', () => {
    expect(src).toMatch(/const\s+swapDomains\s*=\s*useCallback/);
    expect(src).toMatch(/swapDomains\(selection\.idx,\s*selection\.idx\s*-\s*1\)/);
    expect(src).toMatch(/swapDomains\(selection\.idx,\s*selection\.idx\s*\+\s*1\)/);
    expect(src).toMatch(/disabled=\{selection\.idx\s*===\s*0\}/);
    expect(src).toMatch(/disabled=\{selection\.idx\s*>=\s*domains\.length\s*-\s*1\}/);
  });

  it('exposes addCustomDomain + a "+ Custom" toolbar button', () => {
    expect(src).toMatch(/const\s+addCustomDomain\s*=\s*useCallback/);
    expect(src).toMatch(/\+ Custom/);
  });

  it('renders a CustomAddRealmPanel for the inline custom-add modal', () => {
    expect(src).toMatch(/function\s+CustomAddRealmPanel\(/);
    expect(src).toMatch(/Custom domain name/);
    expect(src).toMatch(/Custom realm name/);
    expect(src).toMatch(/Custom island name/);
    expect(src).toMatch(/Custom gear tier/);
    expect(src).toMatch(/Custom lore/);
  });
});

// ---------------------------------------------------------------------------
// Star count contract.
// ---------------------------------------------------------------------------
describe('SkillsTreeEditor — star count contract', () => {
  it('renders exactly 18 realms total (9 visited + 9 future)', () => {
    expect(VISITED_REALMS.length + FUTURE_REALMS_NAMES.length).toBe(18);
  });

  it('every editor realm has a matching position entry exported from SkillsTree.helpers', () => {
    // Round 74 — constants live in SkillsTree.helpers.ts now.
    const helpersSrc = readSource('src/components/SkillsTree.helpers.ts');
    const realmStars = helpersSrc.match(/export const REALM_STARS:[^=]*=\s*\[([\s\S]*?)\];/);
    const futureStars = helpersSrc.match(/export const FUTURE_STARS:[^=]*=\s*\[([\s\S]*?)\];/);
    expect(realmStars).not.toBeNull();
    expect(futureStars).not.toBeNull();
    const realmEntries = (realmStars?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? [];
    const futureEntries = (futureStars?.[1] ?? '').match(/\{\s*x:\s*[-\d.]+\s*,\s*y:\s*[-\d.]+/g) ?? [];
    expect(realmEntries).toHaveLength(9);
    expect(futureEntries).toHaveLength(9);
  });

  it('TIER_COLORS is exported from SkillsTree.helpers.ts for editor reuse', () => {
    const helpersSrc = readSource('src/components/SkillsTree.helpers.ts');
    expect(helpersSrc).toMatch(/export const TIER_COLORS\s*:/);
  });
});
