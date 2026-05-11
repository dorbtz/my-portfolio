/**
 * src/features/content/services/siteContentMap.ts
 *
 * Pure transforms for the site-content CMS. Intentionally NO Supabase
 * imports — keeps this file isolated from the Vitest/rolldown SSR transform
 * issue that hits the network-bearing `siteContent.ts` service module.
 *
 * `siteContent.ts` re-exports these helpers for convenience.
 */

import type { SectionBag, SiteContentMap, SiteContentRow, SiteMode, SiteSection } from '../types';
import { SITE_SECTIONS } from '../types';

/**
 * Build an empty SiteContentMap. Used as the initial state of the Zustand
 * store before the network fetch resolves.
 */
export function emptySiteContentMap(): SiteContentMap {
  const map = {} as SiteContentMap;
  for (const section of SITE_SECTIONS) {
    map[section] = { thor: {}, gear5: {}, shared: {} };
  }
  return map;
}

/**
 * Group a flat row list into the nested SiteContentMap shape.
 * Pure — no I/O, no globals. Tested in `siteContentMap.test.ts`.
 */
export function getSiteContentMap(rows: SiteContentRow[]): SiteContentMap {
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

/**
 * Collapse a SectionBag into the active mode's effective record.
 * Resolution order: mode-specific value → shared (unified) value.
 *
 * Components then layer their own hardcoded fallback constants on top of
 * this — see `useSiteContent.ts` for that wiring.
 */
export function resolveSection(
  bag: SectionBag,
  mode: SiteMode,
): Record<string, unknown> {
  // Start with shared, then overlay the mode-specific values.
  return { ...bag.shared, ...bag[mode] };
}

function isValidSection(s: string): s is SiteSection {
  return (SITE_SECTIONS as readonly string[]).includes(s);
}
