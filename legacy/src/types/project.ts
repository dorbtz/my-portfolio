export type ProjectStatus = "draft" | "in-progress" | "shipped" | "archived";

/**
 * Which dual-mode universe a project belongs to.
 *
 * - `"thor"`  → only visible in Thor (Asgard / Marvel) mode.
 * - `"gear5"` → only visible in Luffy (Gear 5 / One Piece) mode.
 * - `null`    → mode-neutral; visible in BOTH modes.
 *
 * This is the bulletproof / explicit signal. When present on a Supabase row it
 * overrides the keyword-based heuristic in `getProjectMode`. Admins should set
 * it explicitly via the admin UI for every new row to prevent leakage.
 */
export type ProjectMode = "thor" | "gear5";

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectLink {
  label: string;
  url: string;
  icon?: string | null;
}

export interface Project {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  summary: string;
  description: string;
  tags: string[];
  stack: string[];
  tech: string[];
  role?: string;
  status: ProjectStatus;
  /**
   * Explicit dual-mode classification. When set, this overrides the
   * keyword-based heuristic so the project is guaranteed to render only in the
   * matching mode (or both modes, if `null`). Optional for backwards-compat
   * with rows / fixtures predating the column — falls back to keyword scan.
   */
  mode?: ProjectMode | null;
  priority: number;
  sortOrder?: number;
  featured: boolean;
  liveUrl?: string;
  repoUrl?: string;
  coverUrl?: string;
  heroImageAlt?: string;
  heroVideoUrl?: string;
  gallery?: string[];
  links?: ProjectLink[];
  metrics?: ProjectMetric[];
  responsibilities?: string[];
  outcomes?: string[];
  createdAt: string;
  updatedAt?: string;
  owner?: string | null;
  ownerUsername?: string | null;
  ownerDisplayName?: string | null;
  /** Round 34 — owner profile fields read from public.profiles. */
  ownerEmail?: string | null;
  ownerAvatarUrl?: string | null;
  ownerShowName?: boolean;
  ownerShowUsername?: boolean;
  ownerShowEmail?: boolean;
  ownerShowAvatar?: boolean;
  /**
   * `true` when this row is one of the bundled fictional fixtures
   * (`THOR_FIXTURES` / `GEAR5_FIXTURES`).  Real Supabase rows leave this
   * undefined.  Drives the admin "Include placeholder examples" toggle
   * and the "PLACEHOLDER" badge on cards.  See Round 75.
   */
  placeholder?: boolean;
}
