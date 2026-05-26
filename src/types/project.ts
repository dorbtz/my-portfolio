/**
 * Project status — matches the public.projects.status CHECK constraint
 * in Supabase (draft | in-progress | shipped | archived).
 */
export type ProjectStatus = "draft" | "in-progress" | "shipped" | "archived";

export type Project = {
  slug: string;
  title: string;
  /** Short hook shown on cards + above the detail hero. DB column: subtitle. */
  tagline: string;
  /** "The problem" blurb shown on the detail page. DB column: problem. */
  problem: string;
  role: string;
  /** Long-form writeup shown on the detail page. DB column: description. */
  writeup: string;
  stack: string[];
  tags: string[];
  coverUrl: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  status: ProjectStatus;
  featured: boolean;
  priority: number;
  sortOrder: number;
};
