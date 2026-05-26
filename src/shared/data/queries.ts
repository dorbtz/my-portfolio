import { createSupabaseServerClient, hasSupabaseEnv } from "@/shared/lib/supabase/server";
import { PROJECT_FIXTURES } from "@/shared/data/projects";
import type { Project } from "@/types/project";

type ProjectRow = {
  slug: string;
  title: string;
  tagline?: string | null;
  problem?: string | null;
  role?: string | null;
  writeup?: string | null;
  stack?: string[] | null;
  tags?: string[] | null;
  cover_url?: string | null;
  live_url?: string | null;
  repo_url?: string | null;
  status?: Project["status"] | null;
  featured?: boolean | null;
  priority?: number | null;
  sort_order?: number | null;
};

function mapProjectRow(row: ProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? "",
    problem: row.problem ?? "",
    role: row.role ?? "",
    writeup: row.writeup ?? "",
    stack: row.stack ?? [],
    tags: row.tags ?? [],
    coverUrl: row.cover_url ?? null,
    liveUrl: row.live_url ?? null,
    repoUrl: row.repo_url ?? null,
    status: row.status ?? "concept",
    featured: row.featured ?? false,
    priority: row.priority ?? 0,
    sortOrder: row.sort_order ?? 0,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  if (!hasSupabaseEnv()) return [...PROJECT_FIXTURES];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "slug,title,tagline,problem,role,writeup,stack,tags,cover_url,live_url,repo_url,status,featured,priority,sort_order"
      )
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
  return all.filter((p) => p.featured || p.status === "shipped" || p.status === "wip").slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
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
