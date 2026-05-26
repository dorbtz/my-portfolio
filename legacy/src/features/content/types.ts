/**
 * src/features/content/types.ts
 *
 * Site-content CMS types. Backs the `site_content` table (migration
 * `0005_site_content.sql`) and the typed nested map consumed by the homepage
 * components via `useSiteContent()`.
 *
 * Two shapes:
 *   - `SiteContentRow` — one row in the DB. Flat (section, mode, field, value).
 *   - `SiteContentMap` — nested object the components read from.
 *     `{ hero: { thor: {...}, gear5: {...}, shared: {...} }, ... }`
 *
 * Conversions live in `services/siteContent.ts` (`getSiteContentMap`).
 */

export type SiteSection =
  | 'hero'
  | 'about'
  | 'skills'
  | 'projects'
  | 'contact'
  // Round 64 — Phase B of the hidden D-B-T admin entry.  Stores the
  // sequence + gap config so they're editable through the CMS.
  | 'admin';

/** Per-mode content has mode='thor'|'gear5'; unified content has mode=null. */
export type SiteMode = 'thor' | 'gear5';

/** A single row in `public.site_content`. Mirrors the schema 1:1. */
export type SiteContentRow = {
  id: string;
  section: SiteSection;
  /** NULL = unified copy applied to both modes. */
  mode: SiteMode | null;
  field: string;
  /** JSONB column. Could be string, string[], or a nested object. */
  value: unknown;
  updated_at: string;
};

/**
 * Per-mode bag for a single section. `shared` is the union of all unified rows
 * (mode IS NULL). Components prefer `mode-specific → shared → fallback`.
 */
export type SectionBag = {
  thor: Record<string, unknown>;
  gear5: Record<string, unknown>;
  /** Unified rows (mode IS NULL) — applies to both modes. */
  shared: Record<string, unknown>;
};

export type SiteContentMap = Record<SiteSection, SectionBag>;

/**
 * Resolution helper return type — what `useSiteContent('hero')` actually
 * yields to a consumer component. The bag has been collapsed to one record
 * per current mode (mode-specific overrides shared overrides fallback).
 */
export type ResolvedSection<TSection extends SiteSection> = {
  section: TSection;
  mode: SiteMode;
  /** Mode-resolved record: mode-specific value wins, then shared, then fallback. */
  values: Record<string, unknown>;
};

export const SITE_SECTIONS: ReadonlyArray<SiteSection> = [
  'hero',
  'about',
  'skills',
  'projects',
  'contact',
  'admin',
] as const;

export const SITE_MODES: ReadonlyArray<SiteMode> = ['thor', 'gear5'] as const;
