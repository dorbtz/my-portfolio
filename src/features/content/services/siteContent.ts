/**
 * src/features/content/services/siteContent.ts
 *
 * Thin Supabase service for the `site_content` table. Reads are public;
 * writes are gated by RLS (`is_admin()` from migration 0003).
 *
 * Pure transform helpers (`getSiteContentMap`, `resolveSection`,
 * `emptySiteContentMap`) live in `siteContentMap.ts` so they can be
 * unit-tested without importing the Supabase client (which trips
 * Vitest/rolldown's SSR transform on the test runtime).
 */

import { supabase } from '../../../lib/supabase';
import type { SiteContentRow, SiteMode, SiteSection } from '../types';

// Re-export the pure transforms from the isolated module.
export {
  emptySiteContentMap,
  getSiteContentMap,
  resolveSection,
} from './siteContentMap';

// ---------------------------------------------------------------------------
// Public read — no auth required.
// ---------------------------------------------------------------------------

export async function listSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('id, section, mode, field, value, updated_at');
  if (error) {
    // Surface the error to the caller so the hook can fall back gracefully.
    throw error;
  }
  return (data ?? []) as SiteContentRow[];
}

// ---------------------------------------------------------------------------
// Admin write — gated server-side by RLS.
// ---------------------------------------------------------------------------

/**
 * Upsert a single (section, mode, field) row.
 * Pass `mode = null` for unified-across-modes content (e.g. Skills domains).
 */
export async function upsertSiteContent(
  section: SiteSection,
  mode: SiteMode | null,
  field: string,
  value: unknown,
): Promise<void> {
  // Round 35: single ON CONFLICT path — migration 0011 made the
  // (section, mode, field) UNIQUE constraint NULLS NOT DISTINCT so NULL
  // modes match each other, eliminating the need for the previous partial
  // index split.  PostgREST's `on_conflict=section,mode,field` resolves
  // cleanly for BOTH per-mode and unified rows now.
  const { error } = await supabase
    .from('site_content')
    .upsert({ section, mode, field, value }, { onConflict: 'section,mode,field' });
  if (error) throw error;
}

/** Convenience batch — upserts many rows in a single round-trip. */
export async function upsertSiteContentMany(
  rows: Array<{
    section: SiteSection;
    mode: SiteMode | null;
    field: string;
    value: unknown;
  }>,
): Promise<void> {
  if (!rows.length) return;
  // Round 35: single batch — same on_conflict for all rows after the
  // NULLS NOT DISTINCT migration.  No more unified/per-mode split.
  const { error } = await supabase
    .from('site_content')
    .upsert(rows, { onConflict: 'section,mode,field' });
  if (error) throw error;
}

export async function deleteSiteContent(id: string): Promise<void> {
  const { error } = await supabase.from('site_content').delete().eq('id', id);
  if (error) throw error;
}
