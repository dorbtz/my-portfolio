/**
 * src/features/content/admin/SkillsTreeEditor.tsx
 *
 * Round 34 — Thor-mode skills admin: a click-to-edit clone of the live
 * <YggdrasilTree /> (the Norse / Marvel side of the unified skills surface).
 *
 * Why a separate component (and not inline-editing the live <SkillsTree />):
 *   - The live tree carries portal-rendered hover tooltips, keyboard tap-toggle
 *     logic, and a dramatic title strip. None of those make sense in an
 *     editor surface — they fight the user's clicks and obscure the edit
 *     panel.
 *   - We DO reuse the same PNG backdrop (`YGGDRASIL-transparent.png`), the
 *     `REALM_STARS` and `FUTURE_STARS` position constants, and the `TIER_COLORS`
 *     palette — all imported from the live SkillsTree.tsx. That guarantees
 *     the editor visually matches the live tree pixel-for-pixel.
 *   - We DO reuse `.yggdrasil-tree*` and `.yggdrasil-star*` CSS so the
 *     starfield renders identically (no duplicate styling).
 *
 * The editor renders 18 stars total:
 *   - 9 visited skill domains (interactive — full editor incl. children list)
 *   - 9 future realms (interactive — slimmer editor: realm/tier/hint/lore +
 *     "+ Add skill" promotes the future to a real visited domain)
 *
 * Save model — identical to SkillsMapEditor.tsx:
 *   - `domains` and `futureRealms` are stored as `mode IS NULL` rows in
 *     `site_content` (shared across both modes — same source of truth for
 *     Yggdrasil and Grand Line). Each blur commits the WHOLE updated array
 *     via `upsertSiteContentMany([...])` then optimistically patches the
 *     Zustand store via `patchCell`.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  REALM_STARS,
  FUTURE_STARS,
  TIER_COLORS,
} from '../../../components/SkillsTree.helpers';
import type {
  SkillDomain,
  SkillLeaf,
  FutureRealm,
  FutureIsland,
} from '../../../data/skills';
import { upsertSiteContentMany } from '../services/siteContent';
import { useSiteContentStore } from '../stores/siteContentStore';
import InlineEdit from './InlineEdit';

const YGGDRASIL_BG = '/assets/Marvel/skills/YGGDRASIL-transparent.png';

const GEAR_OPTIONS: ReadonlyArray<SkillDomain['gear']> = [
  'Base',
  'Gear 2',
  'Gear 3',
  'Gear 4',
  'Gear 5',
];

const TIER_OPTIONS: ReadonlyArray<FutureRealm['tier']> = [
  'Bifrost',
  'Mystic',
  'Cosmic',
  'Quantum',
  'Multiversal',
];

/** Round 34 — name→position lookup so each realm keeps its canonical star
 *  slot regardless of how many futures have been promoted. Without this, the
 *  positional fallback `FUTURE_STARS[i - REALM_STARS.length]` collides with
 *  `FUTURE_STARS[i]` (used by the now-shrunken futureRealms array) and two
 *  stars end up rendering on the same coordinate. */
const STAR_POS_BY_REALM: Record<string, { x: number; y: number; tier: 'top' | 'mid' | 'root' }> = (() => {
  // Visited canon names — keep parallel to REALM_STARS without re-importing
  // SKILL_DOMAINS (avoids dragging the whole defaults). Order MUST match
  // src/data/skills.ts SKILL_DOMAINS.
  const VISITED_CANON_REALMS = [
    'Vanaheim', 'Jotunheim', 'Svartalfheim', 'Niflheim', 'Helheim',
    'Alfheim', 'Muspelheim', 'Midgard', 'Asgard',
  ];
  const FUTURE_CANON_REALMS = [
    'Wakanda', 'Sanctum Sanctorum', 'Vormir', 'Knowhere', 'Sakaar',
    'Titan', 'Quantum Realm', 'Battleworld', 'Eternity',
  ];
  const map: Record<string, { x: number; y: number; tier: 'top' | 'mid' | 'root' }> = {};
  VISITED_CANON_REALMS.forEach((realm, i) => {
    if (REALM_STARS[i]) map[realm] = REALM_STARS[i];
  });
  FUTURE_CANON_REALMS.forEach((realm, i) => {
    if (FUTURE_STARS[i]) map[realm] = FUTURE_STARS[i];
  });
  return map;
})();

// ---------------------------------------------------------------------------
// Selection state — discriminated union over (visited realm | future realm).
// ---------------------------------------------------------------------------
type Selection =
  | { kind: 'visited'; idx: number }
  | { kind: 'future'; idx: number };

// ---------------------------------------------------------------------------
// EditorStar — leaner than YggdrasilTree's button (no portalled tooltip, no
// hover handler — just click → select). Visuals reuse `.yggdrasil-star*` so
// the star / halo / core / label CSS already matches the live tree.
// ---------------------------------------------------------------------------
function EditorStar({
  pos,
  color,
  initial,
  label,
  selected,
  variant,
  ariaLabel,
  onClick,
}: {
  pos: { x: number; y: number; tier: 'top' | 'mid' | 'root' };
  color: string;
  initial: string;
  label: string;
  selected: boolean;
  variant: 'visited' | 'future';
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'yggdrasil-star',
        `yggdrasil-star--${variant}`,
        `yggdrasil-star--${pos.tier}`,
        selected ? 'yggdrasil-star--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        ['--star-color' as string]: color,
      }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="yggdrasil-star__halo" aria-hidden="true" />
      <span className="yggdrasil-star__core" aria-hidden="true">{initial}</span>
      <span className="yggdrasil-star__label" aria-hidden="true">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main editor.
// ---------------------------------------------------------------------------
type Props = {
  domains: SkillDomain[];
  futureRealms: FutureRealm[];
  /** Round 35 — Luffy-side queue, advanced in lockstep when promoting /
   *  deleting / appending so both visualisations stay aligned. */
  futureIslands: FutureIsland[];
  onDomainsChange: (next: SkillDomain[]) => void;
  onFutureRealmsChange: (next: FutureRealm[]) => void;
  onFutureIslandsChange: (next: FutureIsland[]) => void;
};

export default function SkillsTreeEditor({
  domains,
  futureRealms,
  futureIslands,
  onDomainsChange,
  onFutureRealmsChange,
  onFutureIslandsChange,
}: Props) {
  const patchCell = useSiteContentStore((s) => s.patchCell);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [bgFailed, setBgFailed] = useState(false);
  /** Round 35 — custom-add modal toggle. */
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

  const saveFutureRealms = useCallback(
    async (next: FutureRealm[]) => {
      onFutureRealmsChange(next);
      await upsertSiteContentMany([
        { section: 'skills', mode: null, field: 'futureRealms', value: next },
      ]);
      patchCell('skills', null, 'futureRealms', next);
    },
    [onFutureRealmsChange, patchCell],
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

  const updateFutureRealm = useCallback(
    async (idx: number, patch: Partial<FutureRealm>) => {
      const next = futureRealms.map((f, i) => (i === idx ? { ...f, ...patch } : f));
      await saveFutureRealms(next);
    },
    [futureRealms, saveFutureRealms],
  );

  /** Round 34 / 35 — promote a SPECIFIC future realm (by its current index in
   *  `futureRealms`) into a SkillDomain. Optionally seed it with extra leaves
   *  beyond the default one (used by the future-panel "+ Add skill" flow which
   *  pre-fills a leaf authored in-place). Returns the new visited domain
   *  index so the caller can decide what to select.
   *
   *  Round 35 — when the Thor queue is promoted, the matching index of the
   *  Luffy `futureIslands` queue is ALSO advanced (so Wakanda travels with
   *  Fishman Island, etc.). Both writes ship in a single
   *  `upsertSiteContentMany` batch.
   *
   *  Mirrors SkillsMapEditor.promoteFutureAt — we keep two parallel helpers
   *  rather than one shared one so each editor's UX stays self-contained. */
  const promoteFutureRealmAt = useCallback(
    async (
      futureIdx: number,
      seedLeaves?: SkillLeaf[],
    ): Promise<number | null> => {
      if (futureIdx < 0 || futureIdx >= futureRealms.length) return null;
      const target = futureRealms[futureIdx];
      // Round 35 — pull the parallel island at the same queue index so the
      // promoted SkillDomain carries an island that matches the Luffy side.
      const islandTarget = futureIslands[futureIdx];
      const newDomain: SkillDomain = {
        name: 'New skill domain',
        realm: target.realm,
        island: islandTarget?.island ?? 'Custom Island',
        gear: islandTarget?.gear ?? 'Base',
        lore: target.lore,
        color: '#76cfff',
        children:
          seedLeaves && seedLeaves.length > 0
            ? seedLeaves
            : [
                { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
              ],
      };
      const nextDomains = [...domains, newDomain];
      const nextFutures = futureRealms.filter((_, i) => i !== futureIdx);
      const nextFutureIslands = islandTarget
        ? futureIslands.filter((_, i) => i !== futureIdx)
        : futureIslands;
      onDomainsChange(nextDomains);
      onFutureRealmsChange(nextFutures);
      if (islandTarget) onFutureIslandsChange(nextFutureIslands);
      try {
        const writes: Array<{ section: 'skills'; mode: null; field: string; value: unknown }> = [
          { section: 'skills', mode: null, field: 'domains', value: nextDomains },
          { section: 'skills', mode: null, field: 'futureRealms', value: nextFutures },
        ];
        if (islandTarget) {
          writes.push({ section: 'skills', mode: null, field: 'futureIslands', value: nextFutureIslands });
        }
        await upsertSiteContentMany(writes);
        patchCell('skills', null, 'domains', nextDomains);
        patchCell('skills', null, 'futureRealms', nextFutures);
        if (islandTarget) patchCell('skills', null, 'futureIslands', nextFutureIslands);
        return nextDomains.length - 1;
      } catch (err) {
        // Roll back optimistic update so UI matches DB.
        onDomainsChange(domains);
        onFutureRealmsChange(futureRealms);
        if (islandTarget) onFutureIslandsChange(futureIslands);
        console.error('[SkillsTreeEditor] promoteFutureRealmAt failed', err);
        return null;
      }
    },
    [domains, futureRealms, futureIslands, onDomainsChange, onFutureRealmsChange, onFutureIslandsChange, patchCell],
  );

  /** Toolbar wrapper — promote the FIRST future realm and select the new
   *  visited domain so the full editor opens immediately. */
  const promoteNextFutureRealm = useCallback(async () => {
    const newIdx = await promoteFutureRealmAt(0);
    if (newIdx !== null) {
      setSelection({ kind: 'visited', idx: newIdx });
    }
  }, [promoteFutureRealmAt]);

  /** Future-panel wrapper — promote the SELECTED future and immediately give
   *  it one fresh skill leaf, then keep the new visited domain selected so
   *  the admin can keep adding leaves / editing fields in place. */
  const promoteSelectedFutureRealm = useCallback(async () => {
    if (selection?.kind !== 'future') return;
    const seed: SkillLeaf[] = [
      { name: 'New skill', proficiency: 50, description: 'Describe this skill.' },
    ];
    const newIdx = await promoteFutureRealmAt(selection.idx, seed);
    if (newIdx !== null) {
      setSelection({ kind: 'visited', idx: newIdx });
    }
  }, [promoteFutureRealmAt, selection]);

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

  /** Round 35 — DELETE a visited domain.  Removed from `domains`, prepended
   *  back to BOTH future queues (head) so it becomes the next promote
   *  candidate. */
  const deleteVisitedDomain = useCallback(
    async (domainIdx: number) => {
      if (domainIdx < 0 || domainIdx >= domains.length) return;
      const target = domains[domainIdx];
      const nextDomains = domains.filter((_, i) => i !== domainIdx);
      const nextFutureRealms: FutureRealm[] = [
        {
          realm: target.realm,
          tier: 'Bifrost',
          hint: 'Returned to queue — coming back soon',
          lore: target.lore,
        },
        ...futureRealms,
      ];
      const nextFutureIslands: FutureIsland[] = [
        {
          island: target.island,
          gear: target.gear,
          hint: 'Returned to queue — coming back soon',
          lore: target.lore,
        },
        ...futureIslands,
      ];
      onDomainsChange(nextDomains);
      onFutureRealmsChange(nextFutureRealms);
      onFutureIslandsChange(nextFutureIslands);
      try {
        await upsertSiteContentMany([
          { section: 'skills', mode: null, field: 'domains', value: nextDomains },
          { section: 'skills', mode: null, field: 'futureRealms', value: nextFutureRealms },
          { section: 'skills', mode: null, field: 'futureIslands', value: nextFutureIslands },
        ]);
        patchCell('skills', null, 'domains', nextDomains);
        patchCell('skills', null, 'futureRealms', nextFutureRealms);
        patchCell('skills', null, 'futureIslands', nextFutureIslands);
        setSelection(null);
      } catch (err) {
        onDomainsChange(domains);
        onFutureRealmsChange(futureRealms);
        onFutureIslandsChange(futureIslands);
        console.error('[SkillsTreeEditor] deleteVisitedDomain failed', err);
      }
    },
    [
      domains,
      futureRealms,
      futureIslands,
      onDomainsChange,
      onFutureRealmsChange,
      onFutureIslandsChange,
      patchCell,
    ],
  );

  /** Round 35 — DROP a future realm permanently from the queue (also drops
   *  the parallel island at the same index). */
  const dropFutureRealmAt = useCallback(
    async (futureIdx: number) => {
      if (futureIdx < 0 || futureIdx >= futureRealms.length) return;
      const nextFutures = futureRealms.filter((_, i) => i !== futureIdx);
      const islandTarget = futureIslands[futureIdx];
      const nextFutureIslands = islandTarget
        ? futureIslands.filter((_, i) => i !== futureIdx)
        : futureIslands;
      onFutureRealmsChange(nextFutures);
      if (islandTarget) onFutureIslandsChange(nextFutureIslands);
      try {
        const writes: Array<{ section: 'skills'; mode: null; field: string; value: unknown }> = [
          { section: 'skills', mode: null, field: 'futureRealms', value: nextFutures },
        ];
        if (islandTarget) {
          writes.push({ section: 'skills', mode: null, field: 'futureIslands', value: nextFutureIslands });
        }
        await upsertSiteContentMany(writes);
        patchCell('skills', null, 'futureRealms', nextFutures);
        if (islandTarget) patchCell('skills', null, 'futureIslands', nextFutureIslands);
        setSelection(null);
      } catch (err) {
        onFutureRealmsChange(futureRealms);
        if (islandTarget) onFutureIslandsChange(futureIslands);
        console.error('[SkillsTreeEditor] dropFutureRealmAt failed', err);
      }
    },
    [futureRealms, futureIslands, onFutureRealmsChange, onFutureIslandsChange, patchCell],
  );

  /** Round 35 — REORDER (swap) two visited domains. */
  const swapDomains = useCallback(
    async (idxA: number, idxB: number) => {
      if (idxA < 0 || idxB < 0) return;
      if (idxA >= domains.length || idxB >= domains.length) return;
      if (idxA === idxB) return;
      const next = domains.slice();
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      await saveDomains(next);
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

  /** Round 35 — append a CUSTOM domain (not on the canon future list). */
  const addCustomDomain = useCallback(
    async (input: {
      name: string;
      realm: string;
      island: string;
      gear: SkillDomain['gear'];
      lore: string;
    }) => {
      const newDomain: SkillDomain = {
        name: input.name.trim() || 'New skill domain',
        realm: input.realm.trim() || 'Asgard-tier',
        island: input.island.trim() || 'Custom Island',
        gear: input.gear,
        lore: input.lore.trim() || 'Author the lore for this custom realm.',
        color: '#76cfff',
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
        console.error('[SkillsTreeEditor] addCustomDomain failed', err);
      }
    },
    [domains, onDomainsChange, patchCell],
  );

  const selectedDomain =
    selection?.kind === 'visited' ? domains[selection.idx] ?? null : null;
  const selectedFuture =
    selection?.kind === 'future' ? futureRealms[selection.idx] ?? null : null;

  const initial = (s: string) => s.trim().charAt(0).toUpperCase();

  const visitedStars = useMemo(
    () =>
      domains.map((dom, i) => {
        // Resolve by canonical realm name first (so a promoted future keeps
        // its own star slot), then fall back to position-by-index for the
        // original 9 visited domains.
        const pos = STAR_POS_BY_REALM[dom.realm] ?? REALM_STARS[i];
        if (!pos) return null;
        const isSelected = selection?.kind === 'visited' && selection.idx === i;
        return (
          <EditorStar
            key={`v-${dom.realm}-${i}`}
            pos={pos}
            color={dom.color}
            initial={initial(dom.realm)}
            label={dom.realm}
            selected={isSelected}
            variant="visited"
            ariaLabel={`${dom.realm} — ${dom.name}. Click to edit.`}
            onClick={() => setSelection({ kind: 'visited', idx: i })}
          />
        );
      }),
    [domains, selection],
  );

  const futureStars = useMemo(
    () =>
      futureRealms.map((fr, i) => {
        const pos = STAR_POS_BY_REALM[fr.realm] ?? FUTURE_STARS[i];
        if (!pos) return null;
        const isSelected = selection?.kind === 'future' && selection.idx === i;
        return (
          <EditorStar
            key={`f-${fr.realm}-${i}`}
            pos={pos}
            color={TIER_COLORS[fr.tier]}
            initial={initial(fr.realm)}
            label={fr.realm}
            selected={isSelected}
            variant="future"
            ariaLabel={`${fr.realm} — future ${fr.tier} realm. Click to edit.`}
            onClick={() => setSelection({ kind: 'future', idx: i })}
          />
        );
      }),
    [futureRealms, selection],
  );

  return (
    <div className="skills-tree-editor" data-testid="skills-tree-editor">
      <div className="skills-tree-editor__toolbar">
        <span className="skills-tree-editor__hint">
          Click any realm star to edit its data. Edits commit on blur (or Enter / Cmd-Enter for paragraphs).
        </span>
        {/* Round 34 — promote the next future realm into a real visited
            domain.  Disabled when no future realms remain.
            Round 35 — also advances the parallel islands queue. */}
        <button
          type="button"
          className="skills-tree-editor__add-btn admin-cta admin-cta--primary"
          onClick={promoteNextFutureRealm}
          disabled={futureRealms.length === 0}
          title={
            futureRealms.length === 0
              ? 'No future realms left to promote'
              : `Promotes "${futureRealms[0].realm}" into a visited skill domain`
          }
        >
          + Add new realm
        </button>
        {/* Round 35 — open the custom-add modal. */}
        <button
          type="button"
          className="skills-tree-editor__add-btn admin-cta"
          onClick={() => setCustomOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={customOpen}
          title="Add a custom new realm (not on the canon future list)"
        >
          + Custom
        </button>
      </div>

      {/* The Yggdrasil preview — stars are absolutely positioned over the PNG
          backdrop, same as the live YggdrasilTree. */}
      <div
        className={`skills-tree-editor__tree yggdrasil-tree yggdrasil-tree--png${bgFailed ? ' yggdrasil-tree--no-bg' : ''}`}
      >
        <img
          className="yggdrasil-tree__backdrop"
          src={YGGDRASIL_BG}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setBgFailed(true)}
        />
        <div className="yggdrasil-tree__starfield" aria-hidden={false}>
          {visitedStars}
          {futureStars}
        </div>
      </div>

      {/* Edit panel — visible when a star is selected. */}
      {selection === null && (
        <div className="skills-tree-editor__empty">
          No realm selected — click any star to open its editor.
        </div>
      )}

      {selectedDomain && selection?.kind === 'visited' && (
        <section
          className="skills-tree-editor__panel"
          aria-label={`${selectedDomain.realm} editor`}
        >
          <div className="skills-tree-editor__panel-head">
            <span className="skills-tree-editor__panel-eyebrow">// VISITED REALM</span>
            <h3 className="skills-tree-editor__panel-title">{selectedDomain.realm}</h3>
            {/* Round 35 — reorder controls. */}
            <div className="skills-tree-editor__reorder" role="group" aria-label="Reorder this realm in the voyage">
              <button
                type="button"
                className="skills-tree-editor__reorder-btn"
                onClick={() => void swapDomains(selection.idx, selection.idx - 1)}
                disabled={selection.idx === 0}
                aria-label="Move realm up in the voyage order"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="skills-tree-editor__reorder-btn"
                onClick={() => void swapDomains(selection.idx, selection.idx + 1)}
                disabled={selection.idx >= domains.length - 1}
                aria-label="Move realm down in the voyage order"
                title="Move down"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="skills-tree-editor__close"
              onClick={() => setSelection(null)}
              aria-label="Close editor"
            >
              ×
            </button>
          </div>

          <div className="skills-tree-editor__grid">
            <label className="skills-tree-editor__field">
              <span className="skills-tree-editor__label">Domain name</span>
              <InlineEdit
                value={selectedDomain.name}
                onSave={(v) => updateDomain(selection.idx, { name: v })}
                ariaLabel="Edit domain name"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-tree-editor__field">
              <span className="skills-tree-editor__label">Realm (Norse)</span>
              <InlineEdit
                value={selectedDomain.realm}
                onSave={(v) => updateDomain(selection.idx, { realm: v })}
                ariaLabel="Edit realm"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-tree-editor__field">
              <span className="skills-tree-editor__label">Gear tier</span>
              <select
                className="skills-tree-editor__select"
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

            <label className="skills-tree-editor__field skills-tree-editor__field--wide">
              <span className="skills-tree-editor__label">Lore</span>
              <InlineEdit
                value={selectedDomain.lore}
                onSave={(v) => updateDomain(selection.idx, { lore: v })}
                multiline
                ariaLabel="Edit lore"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>
          </div>

          <div className="skills-tree-editor__leaves">
            <div className="skills-tree-editor__sub-row">
              <h4 className="skills-tree-editor__sub">
                Skills ({selectedDomain.children.length})
              </h4>
              <button
                type="button"
                className="skills-tree-editor__leaf-add admin-cta admin-cta--primary"
                onClick={() => void addLeafToDomain(selection.idx)}
                aria-label="Add a skill leaf to this realm"
              >
                + Add skill
              </button>
            </div>
            {selectedDomain.children.map((leaf, j) => (
              <div className="skills-tree-editor__leaf" key={`leaf-${j}`}>
                <InlineEdit
                  value={leaf.name}
                  onSave={(v) => updateLeaf(selection.idx, j, { name: v })}
                  ariaLabel={`Edit skill ${j + 1} name`}
                >
                  {(v) => <strong className="skills-tree-editor__leaf-name">{v}</strong>}
                </InlineEdit>
                <InlineEdit
                  value={String(leaf.proficiency)}
                  onSave={(v) => {
                    const n = Math.max(0, Math.min(100, Number(v) || 0));
                    return updateLeaf(selection.idx, j, { proficiency: n });
                  }}
                  ariaLabel={`Edit skill ${j + 1} proficiency`}
                >
                  {(v) => <span className="skills-tree-editor__leaf-prof">{v}%</span>}
                </InlineEdit>
                <InlineEdit
                  value={leaf.description}
                  onSave={(v) => updateLeaf(selection.idx, j, { description: v })}
                  multiline
                  ariaLabel={`Edit skill ${j + 1} description`}
                >
                  {(v) => <span className="skills-tree-editor__leaf-desc">{v}</span>}
                </InlineEdit>
              </div>
            ))}
          </div>

          {/* Round 35 — DELETE control. Sends the realm/island back to the
              head of both queues so it's the next promote candidate. */}
          <div className="skills-tree-editor__danger">
            <button
              type="button"
              className="skills-tree-editor__delete admin-cta admin-cta--danger"
              onClick={() => {
                const ok = window.confirm(
                  `Remove "${selectedDomain.realm}" from the voyage? This sends "${selectedDomain.realm} / ${selectedDomain.island}" back to the head of the future queue.`,
                );
                if (ok) void deleteVisitedDomain(selection.idx);
              }}
              aria-label={`Delete ${selectedDomain.realm} and return it to the future queue`}
            >
              Delete realm (return to queue)
            </button>
          </div>
        </section>
      )}

      {selectedFuture && selection?.kind === 'future' && (
        <section
          className="skills-tree-editor__panel"
          aria-label={`${selectedFuture.realm} editor`}
        >
          <div className="skills-tree-editor__panel-head">
            <span className="skills-tree-editor__panel-eyebrow">// FUTURE REALM</span>
            <h3 className="skills-tree-editor__panel-title">{selectedFuture.realm}</h3>
            <button
              type="button"
              className="skills-tree-editor__close"
              onClick={() => setSelection(null)}
              aria-label="Close editor"
            >
              ×
            </button>
          </div>

          <div className="skills-tree-editor__grid">
            <label className="skills-tree-editor__field">
              <span className="skills-tree-editor__label">Realm name</span>
              <InlineEdit
                value={selectedFuture.realm}
                onSave={(v) => updateFutureRealm(selection.idx, { realm: v })}
                ariaLabel="Edit future realm name"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-tree-editor__field">
              <span className="skills-tree-editor__label">Tier</span>
              <select
                className="skills-tree-editor__select"
                value={selectedFuture.tier}
                onChange={(e) =>
                  void updateFutureRealm(selection.idx, {
                    tier: e.target.value as FutureRealm['tier'],
                  })
                }
                aria-label="Edit future tier"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-tree-editor__field skills-tree-editor__field--wide">
              <span className="skills-tree-editor__label">Hint</span>
              <InlineEdit
                value={selectedFuture.hint}
                onSave={(v) => updateFutureRealm(selection.idx, { hint: v })}
                ariaLabel="Edit hint"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>

            <label className="skills-tree-editor__field skills-tree-editor__field--wide">
              <span className="skills-tree-editor__label">Lore</span>
              <InlineEdit
                value={selectedFuture.lore}
                onSave={(v) => updateFutureRealm(selection.idx, { lore: v })}
                multiline
                ariaLabel="Edit lore"
              >
                {(v) => <span className="skills-tree-editor__value">{v}</span>}
              </InlineEdit>
            </label>
          </div>

          {/* Round 34 — promote-on-add-skill. Clicking "+ Add skill" here turns
              this future realm into a real visited SkillDomain (seeded with a
              fresh leaf) and auto-selects it so the user keeps editing in
              place — same panel layout, now with the children list visible. */}
          <div className="skills-tree-editor__leaves">
            <div className="skills-tree-editor__sub-row">
              <h4 className="skills-tree-editor__sub">
                Skills (0 — promote to add)
              </h4>
              <button
                type="button"
                className="skills-tree-editor__leaf-add admin-cta admin-cta--primary"
                onClick={() => void promoteSelectedFutureRealm()}
                aria-label="Promote this future realm to a skill domain and add a skill"
              >
                + Add skill
              </button>
            </div>
            <p className="skills-tree-editor__future-hint">
              This future realm has no skills yet. Adding one will promote
              <strong> {selectedFuture.realm} </strong>
              into a real visited skill domain so you can author skill leaves
              with proficiency %.
            </p>
          </div>

          {/* Round 35 — drop a future realm permanently from the queue. */}
          <div className="skills-tree-editor__danger">
            <button
              type="button"
              className="skills-tree-editor__delete admin-cta admin-cta--danger"
              onClick={() => {
                const ok = window.confirm(
                  `Drop "${selectedFuture.realm}" from the future queue permanently? This cannot be undone (you'd need to re-add it as a custom realm).`,
                );
                if (ok) void dropFutureRealmAt(selection.idx);
              }}
              aria-label={`Drop ${selectedFuture.realm} from the future queue permanently`}
            >
              Drop from future queue
            </button>
          </div>
        </section>
      )}

      {/* Round 35 — custom-add modal (inline conditional panel). */}
      {customOpen && (
        <CustomAddRealmPanel
          gearOptions={GEAR_OPTIONS}
          onCancel={() => setCustomOpen(false)}
          onSubmit={(input) => void addCustomDomain(input)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round 35 — Custom-add inline panel for the Thor/Yggdrasil side. Mirrors
// SkillsMapEditor's CustomAddPanel — different field labels + class names so
// it themes correctly against the Marvel admin shell.
// ---------------------------------------------------------------------------
function CustomAddRealmPanel({
  gearOptions,
  onCancel,
  onSubmit,
}: {
  gearOptions: ReadonlyArray<SkillDomain['gear']>;
  onCancel: () => void;
  onSubmit: (input: {
    name: string;
    realm: string;
    island: string;
    gear: SkillDomain['gear'];
    lore: string;
  }) => void;
}) {
  const [name, setName] = useState('New skill domain');
  const [realm, setRealm] = useState('Custom Realm');
  const [island, setIsland] = useState('Custom Island');
  const [gear, setGear] = useState<SkillDomain['gear']>('Base');
  const [lore, setLore] = useState('');
  return (
    <section
      className="skills-tree-editor__panel skills-tree-editor__panel--custom"
      role="dialog"
      aria-modal="false"
      aria-label="Add a custom new realm"
    >
      <div className="skills-tree-editor__panel-head">
        <span className="skills-tree-editor__panel-eyebrow">// CUSTOM REALM</span>
        <h3 className="skills-tree-editor__panel-title">New custom realm</h3>
        <button
          type="button"
          className="skills-tree-editor__close"
          onClick={onCancel}
          aria-label="Cancel custom add"
        >
          ×
        </button>
      </div>
      <div className="skills-tree-editor__grid">
        <label className="skills-tree-editor__field">
          <span className="skills-tree-editor__label">Domain name</span>
          <input
            className="skills-tree-editor__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Custom domain name"
          />
        </label>
        <label className="skills-tree-editor__field">
          <span className="skills-tree-editor__label">Realm name</span>
          <input
            className="skills-tree-editor__input"
            value={realm}
            onChange={(e) => setRealm(e.target.value)}
            aria-label="Custom realm name"
          />
        </label>
        <label className="skills-tree-editor__field">
          <span className="skills-tree-editor__label">Island name</span>
          <input
            className="skills-tree-editor__input"
            value={island}
            onChange={(e) => setIsland(e.target.value)}
            aria-label="Custom island name"
          />
        </label>
        <label className="skills-tree-editor__field">
          <span className="skills-tree-editor__label">Gear / Tier</span>
          <select
            className="skills-tree-editor__select"
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
        <label className="skills-tree-editor__field skills-tree-editor__field--wide">
          <span className="skills-tree-editor__label">Lore</span>
          <textarea
            className="skills-tree-editor__textarea"
            value={lore}
            onChange={(e) => setLore(e.target.value)}
            rows={3}
            placeholder="Author the lore for this custom realm."
            aria-label="Custom lore"
          />
        </label>
      </div>
      <div className="skills-tree-editor__custom-actions">
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
          onClick={() => onSubmit({ name, realm, island, gear, lore })}
        >
          Save custom realm
        </button>
      </div>
    </section>
  );
}
