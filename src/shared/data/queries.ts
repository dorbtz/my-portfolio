import { createSupabaseServerClient, hasSupabaseEnv } from "@/shared/lib/supabase/server";
import { PROJECT_FIXTURES } from "@/shared/data/projects";
import type { Project, ProjectStatus } from "@/types/project";

/**
 * Raw shape of a row out of public.projects. Columns the UI doesn't surface
 * (summary, tech, hero_image_alt, hero_video_url, gallery, links, metrics,
 * responsibilities, outcomes, owner, mode) are intentionally left out of the
 * Project type — they live in the DB but aren't part of the v2 UI contract.
 */
type ProjectRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  problem: string | null;
  description: string | null;
  role: string | null;
  stack: string[] | null;
  tags: string[] | null;
  cover_url: string | null;
  live_url: string | null;
  repo_url: string | null;
  status: string | null;
  featured: boolean | null;
  priority: number | null;
  sort_order: number | null;
};

function asStatus(v: string | null | undefined): ProjectStatus {
  if (v === "draft" || v === "in-progress" || v === "shipped" || v === "archived") return v;
  return "draft";
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.subtitle ?? "",
    problem: row.problem ?? "",
    role: row.role ?? "",
    writeup: row.description ?? "",
    stack: row.stack ?? [],
    tags: row.tags ?? [],
    coverUrl: row.cover_url ?? null,
    liveUrl: row.live_url ?? null,
    repoUrl: row.repo_url ?? null,
    status: asStatus(row.status),
    featured: row.featured ?? false,
    priority: row.priority ?? 0,
    sortOrder: row.sort_order ?? 0,
  };
}

const PROJECT_COLUMNS =
  "slug,title,subtitle,problem,description,role,stack,tags,cover_url,live_url,repo_url,status,featured,priority,sort_order";

export async function getAllProjects(): Promise<Project[]> {
  if (!hasSupabaseEnv()) return [...PROJECT_FIXTURES];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .neq("status", "archived")
      .order("featured", { ascending: false })
      .order("priority", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return [...PROJECT_FIXTURES];
    return data.map(mapProjectRow);
  } catch {
    return [...PROJECT_FIXTURES];
  }
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  const all = await getAllProjects();
  // The DB-level query already sorts featured-first → priority-desc → sort-asc.
  // Drafts get sorted last by priority anyway, so a simple slice respects intent.
  return all.slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (!error && data) return mapProjectRow(data as ProjectRow);
    } catch {
      // fall through to fixtures
    }
  }
  return PROJECT_FIXTURES.find((p) => p.slug === slug) ?? null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const all = await getAllProjects();
  return all.map((p) => p.slug);
}
