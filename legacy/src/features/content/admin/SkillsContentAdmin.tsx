/**
 * src/features/content/admin/SkillsContentAdmin.tsx
 *
 * Edits the unified Skills data — shared across both modes (single source of
 * truth, both Yggdrasil and Grand Line render from it).
 *
 * Stored as one row per `field` (mode IS NULL):
 *   - field='domains'        — SkillDomain[]    (visited skills, both modes)
 *   - field='futureRealms'   — FutureRealm[]    (Marvel side, Yggdrasil)
 *   - field='futureIslands'  — FutureIsland[]   (One Piece side, Grand Line)
 *
 * Round 31 — Luffy mode renders <SkillsMapEditor>: a clone of the live
 * GrandLineMap with click-to-edit affordances on every silhouette.
 *
 * Round 34 — Thor mode now renders <SkillsTreeEditor>: a clone of the live
 * <YggdrasilTree /> with click-to-edit affordances on every realm star, plus
 * a "+ Add new realm" toolbar button that promotes the next future realm.
 * Replaces the old table-style fieldset editor — both modes are now visual,
 * inline-editable, and self-saving via InlineEdit / promote helpers (no more
 * SaveBar — every blur commits the whole array immediately).
 *
 * Hero / About / Contact / Projects content pages all use the new
 * <InlineEdit> + <ModeTabs> live-preview shell instead.
 */

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import '../../admin-dashboard/styles/admin-dashboard.css';
import { useSiteContentStore } from '../stores/siteContentStore';
import { resolveSection } from '../services/siteContentMap';
import { siteContentDefaults } from '../hooks/siteContentDefaults';
import { useMode } from '../../../shared/stores/mode';
import type {
  SkillDomain,
  FutureRealm,
  FutureIsland,
} from '../../skills/data/skills';

// Round 31 — Luffy-mode map editor. Lazy-loaded so the Thor-mode chunk stays
// small (only loaded when the admin actually toggles into Luffy mode).
const SkillsMapEditor = lazy(() => import('./SkillsMapEditor'));
// Round 34 — Thor-mode tree editor. Lazy-loaded for the same reason — only
// pulled in when the admin lands on the Thor branch of the page.
const SkillsTreeEditor = lazy(() => import('./SkillsTreeEditor'));

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export default function SkillsContentAdmin() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const map = useSiteContentStore((s) => s.map);

  // Unified record (mode IS NULL). Falls back to defaults from skills.ts.
  const initial = useMemo(() => {
    const defaults = siteContentDefaults.skills.thor;
    const fromDb = resolveSection(map.skills, 'thor');
    const merged = { ...defaults, ...fromDb };
    return {
      domains: clone(merged.domains as SkillDomain[]),
      futureRealms: clone(merged.futureRealms as FutureRealm[]),
      futureIslands: clone(merged.futureIslands as FutureIsland[]),
    };
  }, [map]);

  const [domains, setDomains] = useState<SkillDomain[]>(initial.domains);
  const [futureRealms, setFutureRealms] = useState<FutureRealm[]>(initial.futureRealms);
  const [futureIslands, setFutureIslands] = useState<FutureIsland[]>(initial.futureIslands);

  // Re-seed if the DB-backed map updates after first paint. Both inline editors
  // own their own save lifecycle (InlineEdit blur → upsertSiteContentMany), so
  // there's no "dirty" state to guard against here.
  useEffect(() => {
    setDomains(initial.domains);
    setFutureRealms(initial.futureRealms);
    setFutureIslands(initial.futureIslands);
  }, [initial]);

  return (
    <div
      className={[
        'admin-shell admin-shell--projects',
        isThor ? 'admin-shell--thor' : 'admin-shell--manga',
      ].join(' ')}
      data-mode-target={mode}
    >
      <div className="admin-page w-full py-6">
        <AdminTopBar />
        <header className="mb-6">
          <p className="admin-card__eyebrow" style={{ marginBottom: '0.15rem' }}>
            // SKILLS
          </p>
          <h1
            className="admin-card__title"
            style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
          >
            {isThor ? 'Skills tree (Yggdrasil)' : 'Skills · Crew Drills'}
          </h1>
          <p className="mt-1 text-sm opacity-70 max-w-prose">
            Skills are SHARED across both modes — Yggdrasil and Grand Line both
            render from this same data. Edits affect both visualisations
            simultaneously.
          </p>
        </header>

        {/* Round 34 — both modes now render a live-clone editor:
              · Thor   → <SkillsTreeEditor>   (Yggdrasil with click-to-edit stars)
              · Luffy  → <SkillsMapEditor>    (Grand Line with click-to-edit isles) */}
        {/* Round 35 — both editors now receive BOTH future queues + both
            setters so promote / delete / custom-add can advance the parallel
            queue in lockstep. The Luffy editor still drives the visible UI
            from `futureIslands` (and Thor from `futureRealms`), but each
            knows how to push or pop the OTHER queue at the same index so
            the two visualisations stay aligned (same domain index ↔ same
            realm/island pair). */}
        {isThor ? (
          <Suspense
            fallback={
              <div className="admin-card admin-card--inline p-6 opacity-70">
                Climbing the World Tree…
              </div>
            }
          >
            <SkillsTreeEditor
              domains={domains}
              futureRealms={futureRealms}
              futureIslands={futureIslands}
              onDomainsChange={setDomains}
              onFutureRealmsChange={setFutureRealms}
              onFutureIslandsChange={setFutureIslands}
            />
          </Suspense>
        ) : (
          <Suspense
            fallback={
              <div className="admin-card admin-card--inline p-6 opacity-70">
                Charting the Grand Line…
              </div>
            }
          >
            <SkillsMapEditor
              domains={domains}
              futureIslands={futureIslands}
              futureRealms={futureRealms}
              onDomainsChange={setDomains}
              onFutureIslandsChange={setFutureIslands}
              onFutureRealmsChange={setFutureRealms}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
