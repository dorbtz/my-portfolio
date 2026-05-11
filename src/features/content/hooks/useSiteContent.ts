/**
 * src/features/content/hooks/useSiteContent.ts
 *
 * Public hook used by the homepage components (Hero, About, Skills,
 * Projects, Contact) to read CMS-driven copy with synchronous fallback to
 * the existing hardcoded constants (re-exported as `siteContentDefaults`).
 *
 * Lifecycle:
 *   - First mount globally: kick off `listSiteContent()` once, store rows
 *     in the Zustand store.
 *   - Every render: derive the resolved record for `(section, currentMode)`,
 *     layered on top of the static defaults so first paint NEVER flashes.
 *
 * Components consume it like:
 *
 *   const hero = useSiteContent('hero');
 *   hero.titles    // string[] — DB value if present, else static default
 *   hero.paragraph // string
 *
 * The hook is intentionally a tiny wrapper over the store + a memoized
 * derivation. No suspense, no loading state surfaced to the consumer — copy
 * either appears with the fallback (always safe) or upgrades silently when
 * the network resolves.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useMode } from '../../../stores/mode';
import { useSiteContentStore } from '../stores/siteContentStore';
import { listSiteContent, getSiteContentMap, resolveSection } from '../services/siteContent';
import { siteContentDefaults } from './siteContentDefaults';
import type { SiteSection, SiteMode } from '../types';

/**
 * Returns the resolved copy bag for `section`, layered:
 *   defaults[section][mode] ◀ shared (mode IS NULL) ◀ mode-specific
 *
 * Always returns a record — never null, never undefined fields.
 */
export function useSiteContent<TSection extends SiteSection>(
  section: TSection,
): Record<string, unknown> {
  const mode = useMode() as SiteMode;
  const map = useSiteContentStore((s) => s.map);

  // Ensure we kick off the fetch exactly once across the whole app, even if
  // many components call this hook on mount.
  useFetchSiteContentOnce();

  return useMemo(() => {
    // 1. Pull the typed default for this (section, mode).
    const defaults = (siteContentDefaults[section] as Record<SiteMode, Record<string, unknown>> | undefined)?.[mode] ?? {};
    // 2. Resolve the DB-driven values.
    const fromDb = resolveSection(map[section], mode);
    // 3. Layer: defaults ◀ DB.  DB wins when present.
    return { ...defaults, ...fromDb };
  }, [section, mode, map]);
}

/**
 * Module-level latch so multiple hook callers don't trigger N parallel fetches.
 * The Zustand store's `status` is the single source of truth for whether the
 * fetch is in flight.
 */
function useFetchSiteContentOnce() {
  const status = useSiteContentStore((s) => s.status);
  const setMap = useSiteContentStore((s) => s.setMap);
  const setStatus = useSiteContentStore((s) => s.setStatus);
  const setError = useSiteContentStore((s) => s.setError);
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    if (status !== 'idle') return;
    triggered.current = true;
    setStatus('loading');
    listSiteContent()
      .then((rows) => {
        setMap(getSiteContentMap(rows), rows);
      })
      .catch((err) => {
        // Silent failure — components keep using their hardcoded defaults.
        setError(err instanceof Error ? err.message : 'site_content fetch failed');
      });
  }, [status, setMap, setStatus, setError]);
}

// Re-export for convenience.
export { siteContentDefaults } from './siteContentDefaults';
