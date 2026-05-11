/**
 * src/features/content/admin/SkillsMapEditor.tsx
 *
 * Round 31 — Luffy-mode skills admin: live GrandLineMap clone with
 * click-to-edit affordances on every island silhouette.
 *
 * Why a separate component (and not inline-editing the live <GrandLineMap />):
 *   - The live map carries drag-pan, pinch-zoom, voyage-path animation, the
 *     Sunny ship, codex drawer, hover tooltips, and a popup card. None of
 *     those make sense in an editor surface — they'd fight the user's clicks
 *     and obscure the edit panel.
 *   - We DO reuse the same canon silhouettes via `ISLAND_SHAPES` (path-D +
 *     overlays) so the editor map looks visually identical to the live map.
 *   - We DO reuse `.glm-isle*` CSS so silhouettes render with the same
 *     stroke / hover lift / active ring.
 *
 * The editor renders 18 islands total:
 *   - 9 visited skill domains (interactive — full editor including children)
 *   - 9 future islands (interactive — slimmer editor: island/gear/hint/lore)
 *
 * Save model:
 *   - `domains` and `futureRealms` are stored as `mode IS NULL` rows in
 *     `site_content` (they're shared across both modes — same source of
 *     truth for Yggdrasil and Grand Line). The editor commits the WHOLE
 *     array on each blur via `upsertSiteContentMany([...])` then optimistically
 *     patches the Zustand store via `patchCell`. Mirrors the save model used
 *     by the table-style Thor-mode editor on this same page.
 */

import { useCallback, useMemo, useState } from 'react';
import { ISLAND_SHAPES } from '../../skills/grandLineIslandShapes';
import {
  FUTURE_ISLANDS as CANON_FUTURE_ISLANDS,
  type SkillDomain,
  type SkillLeaf,
  type FutureIsland,
  type FutureRealm,
} from '../../skills/data/skills';
import { upsertSiteContentMany } from '../services/siteContent';
import { useSiteContentStore } from '../stores/siteContentStore';
import InlineEdit from './InlineEdit';

// ---------------------------------------------------------------------------
// Layout constants — mirror GrandLineMap.tsx's ALL_ISLAND_POS but flattened
// for an editor-only footprint (no Sunny, no codex, no off-route Laugh Tale
// at -corner). 18 entries: 9 visited (Paradise) + 9 future (New World).
// Coordinate space: x∈[0,100], y∈[0,100].
// ---------------------------------------------------------------------------

type Pos = { x: number; y: number };

/** Visited islands (right of central Red Line at x=51), order matches SKILL_DOMAINS. */
const VISITED_POS: Pos[] = [
  { x: 56, y: 42 }, // 0 Whiskey Peak
  { x: 60, y: 68 }, // 1 Little Garden
  { x: 65, y: 22 }, // 2 Drum Island
  { x: 71, y: 56 }, // 3 Alabasta
  { x: 78, y: 70 }, // 4 Jaya
  { x: 78, y: 18 }, // 5 Skypiea — sky island directly above Jaya
  { x: 86, y: 50 }, // 6 Water 7
  { x: 91, y: 72 }, // 7 Thriller Bark
  { x: 96, y: 38 }, // 8 Sabaody (eastern edge — voyage exits east)
];

/** Future islands (New World, left of central Red Line), order matches
 *  FUTURE_ISLANDS.  Round 36: voyage now wraps cylindrically — Fishman is
 *  the LEFT-EDGE wrap entry point (x≈4) and Laugh Tale is the rightmost
 *  slot (x≈48), just west of the central Red Line.  All entries laid out
 *  LEFT→RIGHT to mirror Paradise's visual rhythm. */
const FUTURE_POS: Pos[] = [
  { x:  4, y: 70 }, // 0 Fishman Island   (left-edge Red Line, wrap entry)
  { x: 10, y: 36 }, // 1 Punk Hazard      (north drift, fire/ice)
  { x: 16, y: 64 }, // 2 Dressrosa        (south, colourful)
  { x: 22, y: 24 }, // 3 Zou              (far north, elephant)
  { x: 28, y: 56 }, // 4 Whole Cake Island (centre-mid, candy)
  { x: 34, y: 70 }, // 5 Wano Country     (south, samurai)
  { x: 40, y: 30 }, // 6 Egghead          (north, futurist)
  { x: 45, y: 58 }, // 7 Elbaph           (near centre, world tree)
  { x: 48, y: 22 }, // 8 Laugh Tale       (rightmost in NW, just before centre Red Line)
];

/** Round 33 — name→position lookup so each island keeps its canonical map
 *  slot regardless of how many futures have been promoted. Without this, the
 *  positional fallback `FUTURE_POS[i - VISITED_POS.length]` collides with
 *  `FUTURE_POS[i]` (used by the now-shrunken futureTiles array) and two
 *  islands end up rendering on the same coordinate. */
const ISLAND_POS_BY_NAME: Record<string, Pos> = (() => {
  // Visited canon order is locked to the SKILL_DOMAINS island names. We can't
  // import them here without dragging the whole defaults — but the runtime
  // domains[].island carries the canonical name forward (preserved across
  // promotions), so `findCanonicalPosition` below derives the slot by name.
  const map: Record<string, Pos> = {};
  // Future names live in the canon FUTURE_ISLANDS array.
  CANON_FUTURE_ISLANDS.forEach((fi, i) => {
    if (FUTURE_POS[i]) map[fi.island] = FUTURE_POS[i];
  });
  // Visited canon names — keep parallel to VISITED_POS without re-importing
  // SKILL_DOMAINS (avoids a circular fixture import).
  const VISITED_CANON_NAMES = [
    'Whiskey Peak', 'Little Garden', 'Drum Island', 'Alabasta', 'Jaya',
    'Skypiea', 'Water 7', 'Thriller Bark', 'Sabaody',
  ];
  VISITED_CANON_NAMES.forEach((name, i) => {
    if (VISITED_POS[i]) map[name] = VISITED_POS[i];
  });
  return map;
})();

const RED_LINE_X = 51;

const GEAR_OPTIONS: ReadonlyArray<SkillDomain['gear']> = [
  'Base',
  'Gear 2',
  'Gear 3',
  'Gear 4',
  'Gear 5',
];

// kebab-case slug → matches public/assets/One-Piece/islands/<slug>.webp
function slugifyIsland(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function islandImageUrl(name: string): string {
  return `/assets/One-Piece/islands/${slugifyIsland(name)}.webp`;
}

// ---------------------------------------------------------------------------
// Selection state — discriminated union over (visited domain | future island).
// ---------------------------------------------------------------------------
type Selection =
  | { kind: 'visited'; idx: number }
  | { kind: 'future'; idx: number };

// ---------------------------------------------------------------------------
// Map background — simplified clone of GrandLineMap's MapBackground (paper
// gradient, Grand Line corridor, Calm Belts, Red Line). Just enough atmosphere
// for the admin to recognise the world map. Editor-scale: no patterns / heavy
// SVG since this is rendered behind clickable silhouettes.
// ---------------------------------------------------------------------------
function MiniMapBackground() {
  return (
    <svg
      className="grand-line-map__bg skills-map-editor__bg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="presentation"
      focusable="false"
    >
      <defs>
        <radialGradient id="sme-paper" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#ede0c4" />
          <stop offset="100%" stopColor="#f5ead8" />
        </radialGradient>
      </defs>
      {/* Paper backdrop (4 sea quadrants merged for editor simplicity). */}
      <rect x="0" y="0" width="100" height="100" fill="url(#sme-paper)" />
      {/* Calm Belt north (above Grand Line). */}
      <rect x="0" y="38" width="100" height="4" fill="#7eb8d4" opacity="0.18" />
      {/* Grand Line corridor. */}
      <rect x="0" y="42" width="100" height="16" fill="#a3c5d8" opacity="0.22" />
      {/* Calm Belt south. */}
      <rect x="0" y="58" width="100" height="4" fill="#7eb8d4" opacity="0.18" />
      {/* Red Line — central vertical orange band (Reverse Mountain spine). */}
      <rect x={RED_LINE_X - 0.6} y="0" width="1.2" height="100" fill="#a85a3a" opacity="0.7" />
      {/* Round 36: left + right edge Red Line strips — show the cylindrical
          wrap so admin sees Fishman under the LEFT-edge Red Line, mirroring
          Sabaody at the RIGHT edge. */}
      <rect x="0" y="0" width="1.6" height="100" fill="#a85a3a" opacity="0.55" />
      <rect x="98.4" y="0" width="1.6" height="100" fill="#a85a3a" opacity="0.55" />
      {/* Reverse Mountain marker. */}
      <circle cx={RED_LINE_X} cy="50" r="2.2" fill="#5a3a25" opacity="0.55" />
      {/* Quadrant labels — small caps. */}
      <text x="25" y="6" fontSize="2.4" fill="#5a3a1a" opacity="0.55" textAnchor="middle">
        NORTH BLUE
      </text>
      <text x="75" y="6" fontSize="2.4" fill="#5a3a1a" opacity="0.55" textAnchor="middle">
        EAST BLUE
      </text>
      <text x="25" y="98" fontSize="2.4" fill="#5a3a1a" opacity="0.55" textAnchor="middle">
        WEST BLUE
      </text>
      <text x="75" y="98" fontSize="2.4" fill="#5a3a1a" opacity="0.55" textAnchor="middle">
        SOUTH BLUE
      </text>
      <text x="50" y="51.6" fontSize="2.6" fill="#5a3a1a" opacity="0.7" textAnchor="middle">
        GRAND LINE
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Editor-island silhouette — leaner than GrandLineMap's IslandSilhouette
// (no aria-expanded popup wiring, no hover tooltip, no focus handlers — just
// click → select). Visuals reuse `.glm-isle*` so the silhouette / outline /
// active-ring CSS already matches the live map.
// ---------------------------------------------------------------------------
function EditorIsland({
  slug,
  displayName,
  pos,
  sizePct,
  pathD,
  overlay,
  modifier,
  ariaLabel,
  onClick,
}: {
  slug: string;
  /** Source name used to resolve the .webp filename. */
  displayName: string;
  pos: Pos;
  sizePct: number;
  pathD: string;
  overlay?: string;
  modifier: 'visited' | 'active' | 'future';
  ariaLabel: string;
  onClick: () => void;
}) {
  const clipId = `sme-clip-${slug}`;
  const modifierClass = `glm-isle--${modifier}`;
  return (
    <button
      type="button"
      data-island={slug}
      className={`glm-isle skills-map-editor__isle ${modifierClass}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${sizePct}%` }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="glm-isle__svg">
        <defs>
          <clipPath id={clipId}>
            <path d={pathD} />
          </clipPath>
        </defs>
        <image
          href={islandImageUrl(displayName)}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
        <path d={pathD} className="glm-isle__outline" />
      </svg>
      {/* Themed canon-icon badge (cactus, castle, etc.) — author-controlled
          static SVG strings (see SECURITY NOTE in grandLineIslandShapes.ts). */}
      {overlay && (
        <span className="glm-isle__icon-badge" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <g dangerouslySetInnerHTML={{ __html: overlay }} />
          </svg>
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main editor.
// ---------------------------------------------------------------------------
type Props = {
  domains: SkillDomain[];
  futureIslands: FutureIsland[];
  /** Round 35 — Thor-side queue, advanced in lockstep when promoting /
   *  deleting / appending so both visualisations stay aligned. */
  futureRealms: FutureRealm[];
  onDomainsChange: (next: SkillDomain[]) => void;
  onFutureIslandsChange: (next: FutureIsland[]) => void;
  onFutureRealmsChange: (next: FutureRealm[]) => void;
};

export default function SkillsMapEditor({
  domains,
  futureIslands,
  futureRealms,
  onDomainsChange,
  onFutureIslandsChange,
  onFutureRealmsChange,
}: Props) {
  const patchCell = useSiteContentStore((s) => s.patchCell);
  const [selection, setSelection] = useState<Selection | null>(null);
  /** Round 35 — custom-add modal toggle. The form fields live in local state
   *  so the user can iterate on them before committing. */
  const [customOpen, setCustomOpen] = useState(false);

  // Persist the WHOLE updated array (skills are stored as a single JSONB row
  // per `field`). Throws on failure so InlineEdit reverts the optimistic value.
  const saveDomains = useCallback(
    async (next: SkillDomain[]) => {
      onDomainsChange(next);
      await upsertSiteContentMany([
        { section: 'skills', mode: null, field: 'domains', value: next },
      ]);
      patchCell('skills', null, 'domains', next);
    },
    [onDomainsChange, patchCell],
  );

  const saveFutureIslands = useCallback(
    async (next: FutureIsland[]) => {
      onFutureIslandsChange(next);
      await upsertSiteContentMany([
        { section: 'skills', mode: null, field: 'futureIslands', value: next },
      ]);
      patchCell('skills', null, 'futureIslands', next);
    },
    [onFutureIslandsChange, patchCell],
  );

  // Targeted updaters — produce a new array with one field of one entry
  // patched, then save.
  const updateDomain = useCallback(
    async (idx: number, patch: Partial<SkillDomain>) => {
      const next = domains.map((d, i) => (i === idx ? { ...d, ...patch } : d));
      await saveDomains(next);
    },
    [domains, saveDomains],
  );

  const updateLeaf = useCallback(
    async (domainIdx: number, leafIdx: number, patch: Partial<SkillLeaf>) => {
      const next = domains.map((d, i) => {
        if (i !== domainIdx) return d;
        const children = d.children.map((c, j) =>
          j === leafIdx ? { ...c, ...patch } : c,
        );
        return { ...d, children };
      });
      await saveDomains(next);
    },
    [domains, saveDomains],
  );

  const updateFuture = useCallback(
    async (idx: number, patch: Partial<FutureIsland>) => {
      const next = futureIslands.map((f, i) => (i === idx ? { ...f, ...patch } : f));
      await saveFutureIslands(next);
    },
    [futureIslands, saveFutureIslands],
  );

  /** Round 33 / 35 — promote a SPECIFIC future island (by its current index in
   *  `futureIslands`) into a SkillDomain. Optionally seed it with extra leaves
   *  beyond the default one (used by the future-panel "+ Add skill" flow which
   *  pre-fills a leaf authored in-place). Returns the new visited domain
   *  index so the caller can decide what to select.
   *
   *  Round 35 — when the Luffy queue is promoted, the matching index of the
   *  Thor `futureRealms` queue is ALSO advanced (so Wakanda travels with
   *  Fishman Island, Sanctum Sanctorum with Punk Hazard, etc.). Both writes
   *  ship in a single `upsertSiteContentMany` batch.
   *
   *  Why a single helper for both flows:
   *   - Toolbar "+ Add new skill" promotes the FIRST future (preserves R32 UX).
   *   - Future-panel "+ Add skill" promotes the CLICKED future and immediately
   *     auto-selects the new visited domain so admin keeps editing.
   *  Both call into the same code path so the persistence story is identical. */
  const promoteFutureAt = useCallback(
    async (
      futureIdx: number,
      seedLeaves?: SkillLeaf[],
    ): Promise<number | null> => {
      if (futureIdx < 0 || futureIdx >= futureIslands.length) return null;
      const target = futureIslands[futureIdx];
      // Round 35 — pull the parallel realm at the same queue index so the
      // promoted SkillDomain carries a realm that matches the Thor side.
      // If the realms queue is shorter (e.g. drifted), fall back to a
      // sensible default so we don't crash.
      const realmTarget = futureRealms[futureIdx];
      const newDomain: SkillDomain = {
        name: 'New skill domain',
        realm: realmTarget?.realm ?? 'Asgard-tier',
        island: target.island,            // carry the canon island name forward
        gear: target.gear,                // inherit the gear tier
        lore: target.lore,                // inherit the lore so the slot has context
        color: '#5fa6c8',                 // sensible default that reads on parchment
        children:
          seedLeaves && seedLeaves.length > 0
            ? seedLeaves
            : [
                { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
              ],
      };
      const nextDomains = [...domains, newDomain];
      const nextFutures = futureIslands.filter((_, i) => i !== futureIdx);
      // Advance the realms queue at the SAME index. If the realm queue is
      // shorter we leave it untouched (no spurious shrink).
      const nextFutureRealms = realmTarget
        ? futureRealms.filter((_, i) => i !== futureIdx)
        : futureRealms;
      onDomainsChange(nextDomains);
      onFutureIslandsChange(nextFutures);
      if (realmTarget) onFutureRealmsChange(nextFutureRealms);
      try {
        const writes: Array<{ section: 'skills'; mode: null; field: string; value: unknown }> = [
          { section: 'skills', mode: null, field: 'domains', value: nextDomains },
          { section: 'skills', mode: null, field: 'futureIslands', value: nextFutures },
        ];
        if (realmTarget) {
          writes.push({ section: 'skills', mode: null, field: 'futureRealms', value: nextFutureRealms });
        }
        await upsertSiteContentMany(writes);
        patchCell('skills', null, 'domains', nextDomains);
        patchCell('skills', null, 'futureIslands', nextFutures);
        if (realmTarget) patchCell('skills', null, 'futureRealms', nextFutureRealms);
        return nextDomains.length - 1;
      } catch (err) {
        // Roll back optimistic update so UI matches DB.
        onDomainsChange(domains);
        onFutureIslandsChange(futureIslands);
        if (realmTarget) onFutureRealmsChange(futureRealms);
        console.error('[SkillsMapEditor] promoteFutureAt failed', err);
        return null;
      }
    },
    [domains, futureIslands, futureRealms, onDomainsChange, onFutureIslandsChange, onFutureRealmsChange, patchCell],
  );

  /** Toolbar wrapper — promote the FIRST future island and select the new
   *  visited domain so the full editor opens immediately. */
  const promoteNextFuture = useCallback(async () => {
    const newIdx = await promoteFutureAt(0);
    if (newIdx !== null) {
      setSelection({ kind: 'visited', idx: newIdx });
    }
  }, [promoteFutureAt]);

  /** Future-panel wrapper — promote the SELECTED future and immediately give
   *  it one fresh skill leaf, then keep the new visited domain selected so
   *  the admin can keep adding leaves / editing fields in place. */
  const promoteSelectedFuture = useCallback(async () => {
    if (selection?.kind !== 'future') return;
    const seed: SkillLeaf[] = [
      { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
    ];
    const newIdx = await promoteFutureAt(selection.idx, seed);
    if (newIdx !== null) {
      setSelection({ kind: 'visited', idx: newIdx });
    }
  }, [promoteFutureAt, selection]);

  /** Add a leaf to an existing visited domain. */
  const addLeafToDomain = useCallback(
    async (domainIdx: number) => {
      const next = domains.map((d, i) =>
        i === domainIdx
          ? {
              ...d,
              children: [
                ...d.children,
                { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
              ],
            }
          : d,
      );
      await saveDomains(next);
    },
    [domains, saveDomains],
  );

  /** Round 35 — DELETE a visited domain.  The domain is removed from
   *  `domains` and prepended back to BOTH future queues so it becomes the
   *  next island to be re-promoted. We use `unshift` semantics (head of
   *  queue) so the user sees the deleted island as the next "+ Add new
   *  skill" candidate. Single batch persist keeps DB consistent. */
  const deleteVisitedDomain = useCallback(
    async (domainIdx: number) => {
      if (domainIdx < 0 || domainIdx >= domains.length) return;
      const target = domains[domainIdx];
      const nextDomains = domains.filter((_, i) => i !== domainIdx);
      const nextFutureIslands: FutureIsland[] = [
        {
          island: target.island,
          gear: target.gear,
          // Hint isn't carried on SkillDomain — set a recognisable default
          // so the user can tell it's been recycled.
          hint: 'Returned to queue — coming back soon',
          lore: target.lore,
        },
        ...futureIslands,
      ];
      const nextFutureRealms: FutureRealm[] = [
        {
          realm: target.realm,
          // Tier defaults to Bifrost if we don't know — visible & themable.
          tier: 'Bifrost',
          hint: 'Returned to queue — coming back soon',
          lore: target.lore,
        },
        ...futureRealms,
      ];
      onDomainsChange(nextDomains);
      onFutureIslandsChange(nextFutureIslands);
      onFutureRealmsChange(nextFutureRealms);
      try {
        await upsertSiteContentMany([
          { section: 'skills', mode: null, field: 'domains', value: nextDomains },
          { section: 'skills', mode: null, field: 'futureIslands', value: nextFutureIslands },
          { section: 'skills', mode: null, field: 'futureRealms', value: nextFutureRealms },
        ]);
        patchCell('skills', null, 'domains', nextDomains);
        patchCell('skills', null, 'futureIslands', nextFutureIslands);
        patchCell('skills', null, 'futureRealms', nextFutureRealms);
        setSelection(null);
      } catch (err) {
        onDomainsChange(domains);
        onFutureIslandsChange(futureIslands);
        onFutureRealmsChange(futureRealms);
        console.error('[SkillsMapEditor] deleteVisitedDomain failed', err);
      }
    },
    [
      domains,
      futureIslands,
      futureRealms,
      onDomainsChange,
      onFutureIslandsChange,
      onFutureRealmsChange,
      patchCell,
    ],
  );

  /** Round 35 — DROP a future island permanently from the queue (also drops
   *  the parallel realm at the same index so the queues stay aligned). */
  const dropFutureIslandAt = useCallback(
    async (futureIdx: number) => {
      if (futureIdx < 0 || futureIdx >= futureIslands.length) return;
      const nextFutures = futureIslands.filter((_, i) => i !== futureIdx);
      const realmTarget = futureRealms[futureIdx];
      const nextFutureRealms = realmTarget
        ? futureRealms.filter((_, i) => i !== futureIdx)
        : futureRealms;
      onFutureIslandsChange(nextFutures);
      if (realmTarget) onFutureRealmsChange(nextFutureRealms);
      try {
        const writes: Array<{ section: 'skills'; mode: null; field: string; value: unknown }> = [
          { section: 'skills', mode: null, field: 'futureIslands', value: nextFutures },
        ];
        if (realmTarget) {
          writes.push({ section: 'skills', mode: null, field: 'futureRealms', value: nextFutureRealms });
        }
        await upsertSiteContentMany(writes);
        patchCell('skills', null, 'futureIslands', nextFutures);
        if (realmTarget) patchCell('skills', null, 'futureRealms', nextFutureRealms);
        setSelection(null);
      } catch (err) {
        onFutureIslandsChange(futureIslands);
        if (realmTarget) onFutureRealmsChange(futureRealms);
        console.error('[SkillsMapEditor] dropFutureIslandAt failed', err);
      }
    },
    [futureIslands, futureRealms, onFutureIslandsChange, onFutureRealmsChange, patchCell],
  );

  /** Round 35 — REORDER (swap) two visited domains. Used by the ↑/↓ buttons
   *  in the visited side panel. The voyage path on the live map reads from
   *  the same `domains` array so the route auto-updates. Selection follows
   *  the moved domain so the panel stays open for the same item. */
  const swapDomains = useCallback(
    async (idxA: number, idxB: number) => {
      if (idxA < 0 || idxB < 0) return;
      if (idxA >= domains.length || idxB >= domains.length) return;
      if (idxA === idxB) return;
      const next = domains.slice();
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      await saveDomains(next);
      // Keep the selection on the same logical domain by swapping its index.
      setSelection((prev) =>
        prev?.kind === 'visited' && prev.idx === idxA
          ? { kind: 'visited', idx: idxB }
          : prev?.kind === 'visited' && prev.idx === idxB
          ? { kind: 'visited', idx: idxA }
          : prev,
      );
    },
    [domains, saveDomains],
  );

  /** Round 35 — append a CUSTOM domain (not on the canon future list).
   *  The admin authors name / island / realm / gear / lore in the modal;
   *  we fill defaults for color + a single seed leaf, then auto-select the
   *  new entry so the user can keep editing inline. */
  const addCustomDomain = useCallback(
    async (input: {
      name: string;
      island: string;
      realm: string;
      gear: SkillDomain['gear'];
      lore: string;
    }) => {
      const newDomain: SkillDomain = {
        name: input.name.trim() || 'New skill domain',
        realm: input.realm.trim() || 'Asgard-tier',
        island: input.island.trim() || 'Custom island',
        gear: input.gear,
        lore: input.lore.trim() || 'Author the lore for this custom domain.',
        color: '#5fa6c8',
        children: [
          { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
        ],
      };
      const nextDomains = [...domains, newDomain];
      onDomainsChange(nextDomains);
      try {
        await upsertSiteContentMany([
          { section: 'skills', mode: null, field: 'domains', value: nextDomains },
        ]);
        patchCell('skills', null, 'domains', nextDomains);
        setSelection({ kind: 'visited', idx: nextDomains.length - 1 });
        setCustomOpen(false);
      } catch (err) {
        onDomainsChange(domains);
        console.error('[SkillsMapEditor] addCustomDomain failed', err);
      }
    },
    [domains, onDomainsChange, patchCell],
  );

  const selectedDomain =
    selection?.kind === 'visited' ? domains[selection.idx] ?? null : null;
  const selectedFuture =
    selection?.kind === 'future' ? futureIslands[selection.idx] ?? null : null;

  const visitedTiles = useMemo(
    () =>
      domains.map((dom, i) => {
        const slug = slugifyIsland(dom.island);
        const def = ISLAND_SHAPES[slug];
        // Round 33 — resolve by canonical island name first (so a promoted
        // future keeps its own map slot), then fall back to position-by-index
        // for the original 9 visited domains.
        const pos = ISLAND_POS_BY_NAME[dom.island] ?? VISITED_POS[i];
        if (!def || !pos) return null;
        const isSelected = selection?.kind === 'visited' && selection.idx === i;
        return (
          <EditorIsland
            key={`v-${slug}-${i}`}
            slug={slug}
            displayName={dom.island}
            pos={pos}
            sizePct={def.sizePct}
            pathD={def.pathD}
            overlay={def.overlay}
            modifier={isSelected ? 'active' : 'visited'}
            ariaLabel={`${dom.island} — ${dom.name}. Click to edit.`}
            onClick={() => setSelection({ kind: 'visited', idx: i })}
          />
        );
      }),
    [domains, selection],
  );

  const futureTiles = useMemo(
    () =>
      futureIslands.map((fi, i) => {
        const slug = slugifyIsland(fi.island);
        const def = ISLAND_SHAPES[slug];
        // Resolve by canonical name so removing earlier futures (via promotion)
        // doesn't shift the remaining ones into the wrong map slots.
        const pos = ISLAND_POS_BY_NAME[fi.island] ?? FUTURE_POS[i];
        if (!def || !pos) return null;
        const isSelected = selection?.kind === 'future' && selection.idx === i;
        return (
          <EditorIsland
            key={`f-${slug}-${i}`}
            slug={slug}
            displayName={fi.island}
            pos={pos}
            sizePct={def.sizePct}
            pathD={def.pathD}
            overlay={def.overlay}
            modifier={isSelected ? 'active' : 'future'}
            ariaLabel={`${fi.island} — future island. Click to edit.`}
            onClick={() => setSelection({ kind: 'future', idx: i })}
          />
        );
      }),
    [futureIslands, selection],
  );

  return (
    <div className="skills-map-editor" data-testid="skills-map-editor">
      <div className="skills-map-editor__toolbar">
        <span className="skills-map-editor__hint">
          Click any island to edit its data. Edits commit on blur (or Enter / Cmd-Enter for paragraphs).
        </span>
        {/* Round 32 — promote the next future island into a real visited
            domain.  Disabled when no future islands remain.
            Round 35 — also advances the parallel realms queue. */}
        <button
          type="button"
          className="skills-map-editor__add-btn admin-cta admin-cta--primary"
          onClick={promoteNextFuture}
          disabled={futureIslands.length === 0}
          title={
            futureIslands.length === 0
              ? 'No future islands left to promote'
              : `Promotes "${futureIslands[0].island}" into a visited skill domain`
          }
        >
          + Add new skill
        </button>
        {/* Round 35 — open the custom-add modal. */}
        <button
          type="button"
          className="skills-map-editor__add-btn admin-cta"
          onClick={() => setCustomOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={customOpen}
          title="Add a custom new island (not on the canon future list)"
        >
          + Custom
        </button>
      </div>

      {/* The map preview — silhouettes are absolutely positioned over the
          background SVG, same as the live GrandLineMap. */}
      <div className="skills-map-editor__map">
        <MiniMapBackground />
        <div className="skills-map-editor__islands">
          {visitedTiles}
          {futureTiles}
        </div>
      </div>

      {/* Edit panel — visible when an island is selected. */}
      {selection === null && (
        <div className="skills-map-editor__empty">
          No island selected — click any silhouette to open its editor.
        </div>
      )}

      {selectedDomain && selection?.kind === 'visited' && (
        <section
          className="skills-map-editor__panel"
          aria-label={`${selectedDomain.island} editor`}
        >
          <div className="skills-map-editor__panel-head">
            <span className="skills-map-editor__panel-eyebrow">// VISITED ISLAND</span>
            <h3 className="skills-map-editor__panel-title">{selectedDomain.island}</h3>
            {/* Round 35 — reorder controls. Disabled at the boundaries. The
                voyage path on the live <GrandLineMap /> reads from the same
                `domains` array so its route auto-updates. */}
            <div className="skills-map-editor__reorder" role="group" aria-label="Reorder this island in the voyage">
              <button
                type="button"
                className="skills-map-editor__reorder-btn"
                onClick={() => void swapDomains(selection.idx, selection.idx - 1)}
                disabled={selection.idx === 0}
                aria-label="Move island up in the voyage order"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="skills-map-editor__reorder-btn"
                onClick={() => void swapDomains(selection.idx, selection.idx + 1)}
                disabled={selection.idx >= domains.length - 1}
                aria-label="Move island down in the voyage order"
                title="Move down"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="skills-map-editor__close"
              onClick={() => setSelection(null)}
              aria-label="Close editor"
            >
              ×
            </button>
          </div>

          <div className="skills-map-editor__grid">
            <label className="skills-map-editor__field">
              <span className="skills-map-editor__label">Domain name</span>
              <InlineEdit
                value={selectedDomain.name}
                onSave={(v) => updateDomain(selection.idx, { name: v })}
                ariaLabel="Edit domain name"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-map-editor__field">
              <span className="skills-map-editor__label">Island (One Piece)</span>
              <InlineEdit
                value={selectedDomain.island}
                onSave={(v) => updateDomain(selection.idx, { island: v })}
                ariaLabel="Edit island"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-map-editor__field">
              <span className="skills-map-editor__label">Gear tier</span>
              <select
                className="skills-map-editor__select"
                value={selectedDomain.gear}
                onChange={(e) =>
                  void updateDomain(selection.idx, {
                    gear: e.target.value as SkillDomain['gear'],
                  })
                }
                aria-label="Edit gear tier"
              >
                {GEAR_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-map-editor__field skills-map-editor__field--wide">
              <span className="skills-map-editor__label">Lore</span>
              <InlineEdit
                value={selectedDomain.lore}
                onSave={(v) => updateDomain(selection.idx, { lore: v })}
                multiline
                ariaLabel="Edit lore"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>
          </div>

          <div className="skills-map-editor__leaves">
            <div className="skills-map-editor__sub-row">
              <h4 className="skills-map-editor__sub">
                Skills ({selectedDomain.children.length})
              </h4>
              <button
                type="button"
                className="skills-map-editor__leaf-add admin-cta admin-cta--primary"
                onClick={() => void addLeafToDomain(selection.idx)}
                aria-label="Add a skill leaf to this domain"
              >
                + Add skill
              </button>
            </div>
            {selectedDomain.children.map((leaf, j) => (
              <div className="skills-map-editor__leaf" key={`leaf-${j}`}>
                <InlineEdit
                  value={leaf.name}
                  onSave={(v) => updateLeaf(selection.idx, j, { name: v })}
                  ariaLabel={`Edit skill ${j + 1} name`}
                >
                  {(v) => <strong className="skills-map-editor__leaf-name">{v}</strong>}
                </InlineEdit>
                <InlineEdit
                  value={String(leaf.proficiency)}
                  onSave={(v) => {
                    const n = Math.max(0, Math.min(100, Number(v) || 0));
                    return updateLeaf(selection.idx, j, { proficiency: n });
                  }}
                  ariaLabel={`Edit skill ${j + 1} proficiency`}
                >
                  {(v) => <span className="skills-map-editor__leaf-prof">{v}%</span>}
                </InlineEdit>
                <InlineEdit
                  value={leaf.description}
                  onSave={(v) => updateLeaf(selection.idx, j, { description: v })}
                  multiline
                  ariaLabel={`Edit skill ${j + 1} description`}
                >
                  {(v) => <span className="skills-map-editor__leaf-desc">{v}</span>}
                </InlineEdit>
              </div>
            ))}
          </div>

          {/* Round 35 — DELETE control. window.confirm guard against
              accidental loss; the deleted island lands at the head of both
              future queues so it's the next "+ Add new skill" candidate. */}
          <div className="skills-map-editor__danger">
            <button
              type="button"
              className="skills-map-editor__delete admin-cta admin-cta--danger"
              onClick={() => {
                const ok = window.confirm(
                  `Remove "${selectedDomain.island}" from the voyage? This sends "${selectedDomain.realm} / ${selectedDomain.island}" back to the head of the future queue.`,
                );
                if (ok) void deleteVisitedDomain(selection.idx);
              }}
              aria-label={`Delete ${selectedDomain.island} and return it to the future queue`}
            >
              Delete island (return to queue)
            </button>
          </div>
        </section>
      )}

      {selectedFuture && selection?.kind === 'future' && (
        <section
          className="skills-map-editor__panel"
          aria-label={`${selectedFuture.island} editor`}
        >
          <div className="skills-map-editor__panel-head">
            <span className="skills-map-editor__panel-eyebrow">// FUTURE ISLAND</span>
            <h3 className="skills-map-editor__panel-title">{selectedFuture.island}</h3>
            <button
              type="button"
              className="skills-map-editor__close"
              onClick={() => setSelection(null)}
              aria-label="Close editor"
            >
              ×
            </button>
          </div>

          <div className="skills-map-editor__grid">
            <label className="skills-map-editor__field">
              <span className="skills-map-editor__label">Island name</span>
              <InlineEdit
                value={selectedFuture.island}
                onSave={(v) => updateFuture(selection.idx, { island: v })}
                ariaLabel="Edit future island name"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-map-editor__field">
              <span className="skills-map-editor__label">Gear tier</span>
              <select
                className="skills-map-editor__select"
                value={selectedFuture.gear}
                onChange={(e) =>
                  void updateFuture(selection.idx, {
                    gear: e.target.value as SkillDomain['gear'],
                  })
                }
                aria-label="Edit future gear tier"
              >
                {GEAR_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-map-editor__field skills-map-editor__field--wide">
              <span className="skills-map-editor__label">Hint</span>
              <InlineEdit
                value={selectedFuture.hint}
                onSave={(v) => updateFuture(selection.idx, { hint: v })}
                ariaLabel="Edit hint"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-map-editor__field skills-map-editor__field--wide">
              <span className="skills-map-editor__label">Lore</span>
              <InlineEdit
                value={selectedFuture.lore}
                onSave={(v) => updateFuture(selection.idx, { lore: v })}
                multiline
                ariaLabel="Edit lore"
              >
                {(v) => <span className="skills-map-editor__value">{v}</span>}
              </InlineEdit>
            </label>
          </div>

          {/* Round 33 — promote-on-add-skill. Clicking "+ Add skill" here turns
              this future island into a real visited SkillDomain (seeded with a
              fresh leaf) and auto-selects it so the user keeps editing in
              place — same panel layout, now with the children list visible. */}
          <div className="skills-map-editor__leaves">
            <div className="skills-map-editor__sub-row">
              <h4 className="skills-map-editor__sub">
                Skills (0 — promote to add)
              </h4>
              <button
                type="button"
                className="skills-map-editor__leaf-add admin-cta admin-cta--primary"
                onClick={() => void promoteSelectedFuture()}
                aria-label="Promote this future island to a skill domain and add a skill"
              >
                + Add skill
              </button>
            </div>
            <p className="skills-map-editor__future-hint">
              This future slot has no skills yet. Adding one will promote
              <strong> {selectedFuture.island} </strong>
              into a real visited skill domain so you can author skill leaves
              with proficiency %.
            </p>
          </div>

          {/* Round 35 — drop a future island permanently from the queue.
              Useful for trimming. Confirmed because it's destructive. */}
          <div className="skills-map-editor__danger">
            <button
              type="button"
              className="skills-map-editor__delete admin-cta admin-cta--danger"
              onClick={() => {
                const ok = window.confirm(
                  `Drop "${selectedFuture.island}" from the future queue permanently? This cannot be undone (you'd need to re-add it as a custom island).`,
                );
                if (ok) void dropFutureIslandAt(selection.idx);
              }}
              aria-label={`Drop ${selectedFuture.island} from the future queue permanently`}
            >
              Drop from future queue
            </button>
          </div>
        </section>
      )}

      {/* Round 35 — custom-add modal. Inline conditional panel (no <dialog>
          required) — keeps focus management simple and doesn't need any
          extra polyfill. Renders only when open so it adds zero DOM weight
          when idle. */}
      {customOpen && (
        <CustomAddPanel
          gearOptions={GEAR_OPTIONS}
          onCancel={() => setCustomOpen(false)}
          onSubmit={(input) => void addCustomDomain(input)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round 35 — Custom-add inline panel. Self-contained so the parent's render
// stays readable. Fields: name (domain), island (display name), realm
// (Norse-side), gear, lore. Validation is light — defaults fill in if blank.
// ---------------------------------------------------------------------------
function CustomAddPanel({
  gearOptions,
  onCancel,
  onSubmit,
}: {
  gearOptions: ReadonlyArray<SkillDomain['gear']>;
  onCancel: () => void;
  onSubmit: (input: {
    name: string;
    island: string;
    realm: string;
    gear: SkillDomain['gear'];
    lore: string;
  }) => void;
}) {
  const [name, setName] = useState('New skill domain');
  const [island, setIsland] = useState('Custom Island');
  const [realm, setRealm] = useState('Asgard-tier');
  const [gear, setGear] = useState<SkillDomain['gear']>('Base');
  const [lore, setLore] = useState('');
  return (
    <section
      className="skills-map-editor__panel skills-map-editor__panel--custom"
      role="dialog"
      aria-modal="false"
      aria-label="Add a custom new island"
    >
      <div className="skills-map-editor__panel-head">
        <span className="skills-map-editor__panel-eyebrow">// CUSTOM ISLAND</span>
        <h3 className="skills-map-editor__panel-title">New custom island</h3>
        <button
          type="button"
          className="skills-map-editor__close"
          onClick={onCancel}
          aria-label="Cancel custom add"
        >
          ×
        </button>
      </div>
      <div className="skills-map-editor__grid">
        <label className="skills-map-editor__field">
          <span className="skills-map-editor__label">Domain name</span>
          <input
            className="skills-map-editor__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Custom domain name"
          />
        </label>
        <label className="skills-map-editor__field">
          <span className="skills-map-editor__label">Island name</span>
          <input
            className="skills-map-editor__input"
            value={island}
            onChange={(e) => setIsland(e.target.value)}
            aria-label="Custom island name"
          />
        </label>
        <label className="skills-map-editor__field">
          <span className="skills-map-editor__label">Realm name</span>
          <input
            className="skills-map-editor__input"
            value={realm}
            onChange={(e) => setRealm(e.target.value)}
            placeholder="Asgard-tier"
            aria-label="Custom realm name"
          />
        </label>
        <label className="skills-map-editor__field">
          <span className="skills-map-editor__label">Gear / Tier</span>
          <select
            className="skills-map-editor__select"
            value={gear}
            onChange={(e) => setGear(e.target.value as SkillDomain['gear'])}
            aria-label="Custom gear tier"
          >
            {gearOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="skills-map-editor__field skills-map-editor__field--wide">
          <span className="skills-map-editor__label">Lore</span>
          <textarea
            className="skills-map-editor__textarea"
            value={lore}
            onChange={(e) => setLore(e.target.value)}
            rows={3}
            placeholder="Author the lore for this custom domain."
            aria-label="Custom lore"
          />
        </label>
      </div>
      <div className="skills-map-editor__custom-actions">
        <button
          type="button"
          className="admin-cta"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="admin-cta admin-cta--primary"
          onClick={() => onSubmit({ name, island, realm, gear, lore })}
        >
          Save custom island
        </button>
      </div>
    </section>
  );
}
