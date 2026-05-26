/**
 * src/features/content/admin/useContentEditor.ts
 *
 * Shared editor state for an admin/content page.
 *
 * Each editor edits TWO independent draft records (one per mode). Initial
 * values come from the in-memory map (DB → defaults fallback already applied
 * upstream by `useSiteContent`). Save calls `upsertSiteContentMany` for ONLY
 * the changed cells per mode and then patches the Zustand store optimistically.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { upsertSiteContentMany } from '../services/siteContent';
import { useSiteContentStore } from '../stores/siteContentStore';
import { resolveSection } from '../services/siteContentMap';
import { siteContentDefaults } from '../hooks/siteContentDefaults';
import type { SiteSection, SiteMode } from '../types';

export type ContentDraft = Record<string, unknown>;

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export type ContentEditorState = {
  thor: ContentDraft;
  gear5: ContentDraft;
  setField: (mode: SiteMode, field: string, value: unknown) => void;
  setMany: (mode: SiteMode, patch: Partial<ContentDraft>) => void;
  /** Reset both drafts to the current resolved (DB ◀ defaults) values. */
  reset: () => void;
  /** Persist only changed cells per mode. */
  save: () => Promise<void>;
  /** Round 29 — persist a SINGLE field immediately (used by InlineEdit
   *  primitive's per-blur save). Updates draft optimistically + writes to
   *  Supabase, throwing on failure so the caller can revert. */
  saveField: (mode: SiteMode, field: string, value: unknown) => Promise<void>;
  status: SaveStatus;
  error: string | null;
};

export function useContentEditor(section: SiteSection): ContentEditorState {
  const map = useSiteContentStore((s) => s.map);
  const patchCell = useSiteContentStore((s) => s.patchCell);

  // Build the initial resolved-per-mode draft from defaults ◀ DB.
  const buildInitial = useCallback(
    (mode: SiteMode): ContentDraft => {
      const defaults =
        (siteContentDefaults[section] as Record<SiteMode, ContentDraft> | undefined)?.[mode] ?? {};
      const fromDb = resolveSection(map[section], mode);
      return { ...defaults, ...fromDb };
    },
    [section, map],
  );

  const [thor, setThor] = useState<ContentDraft>(() => buildInitial('thor'));
  const [gear5, setGear5] = useState<ContentDraft>(() => buildInitial('gear5'));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Re-seed drafts when the underlying map updates (e.g. fetch resolves AFTER
  // first paint). Only seed if the user hasn't started editing yet — once
  // `status !== 'idle'` we treat the draft as authoritative.
  useEffect(() => {
    if (status !== 'idle') return;
    setThor(buildInitial('thor'));
    setGear5(buildInitial('gear5'));
  }, [buildInitial, status]);

  const setField = useCallback((mode: SiteMode, field: string, value: unknown) => {
    if (mode === 'thor') setThor((prev) => ({ ...prev, [field]: value }));
    else setGear5((prev) => ({ ...prev, [field]: value }));
    setStatus((s) => (s === 'success' ? 'idle' : s));
  }, []);

  const setMany = useCallback((mode: SiteMode, patch: Partial<ContentDraft>) => {
    if (mode === 'thor') setThor((prev) => ({ ...prev, ...patch }));
    else setGear5((prev) => ({ ...prev, ...patch }));
    setStatus((s) => (s === 'success' ? 'idle' : s));
  }, []);

  const reset = useCallback(() => {
    setThor(buildInitial('thor'));
    setGear5(buildInitial('gear5'));
    setStatus('idle');
    setError(null);
  }, [buildInitial]);

  const save = useCallback(async () => {
    setStatus('saving');
    setError(null);
    try {
      // Diff each mode's draft against the current resolved values; only
      // upsert the changed cells. Cuts wire payload + minimises RLS work.
      const rows: Array<{ section: SiteSection; mode: SiteMode | null; field: string; value: unknown }> = [];
      const thorBaseline = buildInitial('thor');
      const gear5Baseline = buildInitial('gear5');
      for (const [field, value] of Object.entries(thor)) {
        if (!shallowEqual(value, thorBaseline[field])) {
          rows.push({ section, mode: 'thor', field, value });
        }
      }
      for (const [field, value] of Object.entries(gear5)) {
        if (!shallowEqual(value, gear5Baseline[field])) {
          rows.push({ section, mode: 'gear5', field, value });
        }
      }
      if (!rows.length) {
        setStatus('success');
        return;
      }
      await upsertSiteContentMany(rows);
      // Optimistic store patch — saves us a re-fetch.
      for (const r of rows) {
        patchCell(r.section, r.mode, r.field, r.value);
      }
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [section, thor, gear5, buildInitial, patchCell]);

  // Round 29 — per-field save. Used by the inline-edit primitive to commit
  // a single change on blur/Enter without a global "Save changes" button.
  const saveField = useCallback(
    async (mode: SiteMode, field: string, value: unknown) => {
      setStatus('saving');
      setError(null);
      try {
        await upsertSiteContentMany([{ section, mode, field, value }]);
        patchCell(section, mode, field, value);
        // Mirror the new value into local draft so re-renders pick it up.
        if (mode === 'thor') setThor((prev) => ({ ...prev, [field]: value }));
        else setGear5((prev) => ({ ...prev, [field]: value }));
        setStatus('success');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Save failed');
        throw e;
      }
    },
    [section, patchCell],
  );

  return useMemo(
    () => ({ thor, gear5, setField, setMany, reset, save, saveField, status, error }),
    [thor, gear5, setField, setMany, reset, save, saveField, status, error],
  );
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  // For arbitrary JSON-shaped values we fall back to JSON-compare; cheap and
  // correct for the structures we put in this table (strings, string arrays,
  // small flat objects).
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
