import { supabase } from "../../../shared/lib/supabase";
import { mapProjectRow, mapProjectRows } from "../lib/project-mapper";
import type { Project } from "../../../types/project";
import { projectFixtures } from "./project-fixtures";

type Primitive = string | number | boolean | undefined;

export type ProjectQueryParams = {
  tag?: Primitive;
  status?: Primitive;
  featured?: Primitive;
  limit?: Primitive;
};

export type ProjectQueryInput =
  | string
  | URLSearchParams
  | ProjectQueryParams;

type ProjectQuery = {
  tag?: string;
  status?: string;
  featured?: boolean;
  limit?: number;
};

const DEFAULT_QUERY: ProjectQuery = {};

function normalizeProjectQuery(input?: ProjectQueryInput | ProjectQuery): ProjectQuery {
  if (!input) return { ...DEFAULT_QUERY };

  if (typeof input === "string") {
    const search = input.startsWith("?") ? input.slice(1) : input;
    return normalizeProjectQuery(new URLSearchParams(search));
  }

  if (input instanceof URLSearchParams) {
    const featuredParam = input.get("featured");
    const limitParam = input.get("limit");
    const status = input.get("status") || undefined;
    const tag = input.get("tag") || undefined;
    return {
      tag,
      status,
      featured:
        featuredParam === null
          ? undefined
          : featuredParam === "true" || featuredParam === "1",
      limit: limitParam ? Number(limitParam) || undefined : undefined,
    };
  }

  const query: ProjectQuery = {};
  const { tag, status, featured, limit } = input;
  if (typeof tag === "string" && tag.trim()) query.tag = tag.trim();
  if (typeof status === "string" && status.trim()) query.status = status.trim();
  if (typeof featured === "boolean") query.featured = featured;
  if (typeof featured === "string") {
    const normalized = featured.toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) query.featured = true;
    if (["false", "0", "no"].includes(normalized)) query.featured = false;
  }
  if (typeof limit === "number" && Number.isFinite(limit)) query.limit = limit;
  if (typeof limit === "string") {
    const numeric = Number(limit);
    if (!Number.isNaN(numeric)) query.limit = numeric;
  }
  return query;
}

function compareProjects(a: Project, b: Project) {
  const orderDiff =
    (typeof a.sortOrder === "number" ? a.sortOrder : 9999) -
    (typeof b.sortOrder === "number" ? b.sortOrder : 9999);
  if (orderDiff !== 0) return orderDiff;
  const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
  if (priorityDiff !== 0) return priorityDiff;
  const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
  const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
  return bTime - aTime;
}

function applyFilters(data: Project[], query: ProjectQuery) {
  let result = [...data];
  if (typeof query.featured === "boolean") {
    result = result.filter((project) => project.featured === query.featured);
  }
  if (query.status) {
    result = result.filter((project) => project.status === query.status);
  }
  if (query.tag) {
    const tagLower = query.tag.toLowerCase();
    result = result.filter((project) =>
      project.tags.some((t) => t.toLowerCase() === tagLower) ||
      project.stack.some((t) => t.toLowerCase() === tagLower)
    );
  }
  result.sort(compareProjects);
  if (typeof query.limit === "number" && query.limit > 0) {
    result = result.slice(0, query.limit);
  }
  return result;
}

export async function getProjects(input?: ProjectQueryInput | ProjectQuery): Promise<Project[]> {
  const query = normalizeProjectQuery(input);

  if (supabase) {
    try {
      let request = supabase.from("projects").select("*");
      if (typeof query.featured === "boolean") {
        request = request.eq("featured", query.featured);
      }
      if (query.status) {
        request = request.eq("status", query.status);
      }
      if (query.tag) {
        request = request.contains("tags", [query.tag]);
      }
      request = request
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (typeof query.limit === "number" && query.limit > 0) {
        request = request.limit(query.limit);
      }
      const { data, error } = await request;
      if (!error && data) {
        return applyFilters(mapProjectRows(data), query);
      }
    } catch (err) {
      console.warn("[projects] Falling back to fixtures", err);
    }
  }

  return applyFilters(projectFixtures.map(mapProjectRow), query);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", normalizedSlug)
        .single();
      if (!error && data) {
        return mapProjectRow(data);
      }
    } catch (err) {
      console.warn(`[projects] Failed to fetch project ${normalizedSlug}`, err);
    }
  }

  const fallback = projectFixtures.find((project) => project.slug === normalizedSlug || project.id === normalizedSlug);
  return fallback ? mapProjectRow(fallback) : null;
}

export async function getAllTags(): Promise<string[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("projects").select("tags");
      if (!error && Array.isArray(data)) {
        const tagSet = new Set<string>();
        for (const row of data) {
          const tags = Array.isArray(row?.tags)
            ? row.tags
            : typeof row?.tags === "string"
            ? row.tags.split(",").map((item: string) => item.trim()).filter(Boolean)
            : [];
          tags.forEach((tag) => tagSet.add(tag));
        }
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
      }
    } catch (err) {
      console.warn("[projects] Failed to fetch tags", err);
    }
  }

  const allTags = new Set<string>();
  for (const project of projectFixtures) {
    project.tags.forEach((tag) => allTags.add(tag));
  }
  return Array.from(allTags).sort((a, b) => a.localeCompare(b));
}

export { projectFixtures };

const projectsApi = {
  getProjects,
  getProjectBySlug,
  getAllTags,
  projectFixtures,
};

export default projectsApi;
