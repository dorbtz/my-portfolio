/**
 * src/features/content/stores/siteContentStore.ts
 *
 * Zustand store for the site-content CMS map. Loaded once on app mount via
 * `useSiteContent()`'s effect. Components read from this store synchronously
 * so the first render uses whatever's already in memory (initially the empty
 * map → triggers fallback to hardcoded constants), then re-renders with the
 * DB values once they arrive.
 */

import { create } from 'zustand';
import { emptySiteContentMap } from '../services/siteContent';
import type { SiteContentMap, SiteContentRow } from '../types';

export type ContentLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SiteContentState = {
  map: SiteContentMap;
  status: ContentLoadStatus;
  /** Raw rows last fetched, cached for the admin editor's diff/save flows. */
  rows: SiteContentRow[];
  /** Last fetch error message (cleared on success). */
  error: string | null;

  setMap: (map: SiteContentMap, rows: SiteContentRow[]) => void;
  setStatus: (status: ContentLoadStatus) => void;
  setError: (error: string | null) => void;
  /**
   * Patch a single (section, mode, field) cell in the in-memory map after a
   * successful admin save. Avoids re-fetching the entire table.
   */
  patchCell: (
    section: keyof SiteContentMap,
    mode: 'thor' | 'gear5' | null,
    field: string,
    value: unknown,
  ) => void;
};

export const useSiteContentStore = create<SiteContentState>((set) => ({
  map: emptySiteContentMap(),
  status: 'idle',
  rows: [],
  error: null,

  setMap: (map, rows) => set({ map, rows, status: 'ready', error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'ready' }),
  patchCell: (section, mode, field, value) =>
    set((state) => {
      const nextMap: SiteContentMap = {
        ...state.map,
        [section]: {
          ...state.map[section],
          ...(mode === null
            ? { shared: { ...state.map[section].shared, [field]: value } }
            : mode === 'thor'
              ? { thor: { ...state.map[section].thor, [field]: value } }
              : { gear5: { ...state.map[section].gear5, [field]: value } }),
        },
      };
      return { map: nextMap };
    }),
}));
