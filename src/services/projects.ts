import { supabase } from "../lib/supabase";
import { projectFixtures } from "../data/projects";
import { mapProjectRow, mapProjectRows, projectToInsert, projectToUpdate } from "../lib/project-mapper";
import type { Project } from "../types/project";
import { getProfilesByIds } from "./profiles";

// ---------------------------------------------------------------------------
// In-memory cache with 60-second TTL
// ---------------------------------------------------------------------------
const LIST_TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };

let listCache: CacheEntry<Project[]> | null = null;
const singleCache = new Map<string, CacheEntry<Project | null>>();

function isFresh<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  return entry != null && Date.now() < entry.expiresAt;
}

/**
 * Exported so admin mutations can call clearProjectsCache() after writes.
 * P2 admin UI will call this; wiring is done there.
 */
export function clearProjectsCache(): void {
  listCache = null;
  singleCache.clear();
}

// ---------------------------------------------------------------------------

async function attachOwnerProfiles(projects: Project[]): Promise<Project[]> {
  const ownerIds = projects
    .map((project) => project.owner)
    .filter((value): value is string => Boolean(value));
  if (!ownerIds.length) return projects;
  const profiles = await getProfilesByIds(ownerIds);
  return projects.map((project) => {
    if (!project.owner) return project;
    const profile = profiles[project.owner];
    if (!profile) return project;
    return {
      ...project,
      ownerUsername: profile.username ?? project.ownerUsername ?? null,
      ownerDisplayName: profile.display_name ?? project.ownerDisplayName ?? null,
      // Round 34 — extended owner identity for the project card byline.
      ownerEmail: profile.email ?? project.ownerEmail ?? null,
      ownerAvatarUrl: profile.avatar_url ?? project.ownerAvatarUrl ?? null,
      ownerShowName: profile.show_name ?? true,
      ownerShowUsername: profile.show_username ?? true,
      ownerShowEmail: profile.show_email ?? false,
      ownerShowAvatar: profile.show_avatar ?? true,
    };
  });
}

export async function listProjects(): Promise<Project[]> {
  // Return cached list if still fresh
  if (isFresh(listCache)) {
    return listCache.value;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[projects] Falling back to fixtures", error);
    return projectFixtures.map(mapProjectRow);
  }

  const projects = await attachOwnerProfiles(mapProjectRows(data));

  // Populate list cache and pre-warm per-item cache
  listCache = { value: projects, expiresAt: Date.now() + LIST_TTL_MS };
  for (const p of projects) {
    const exp = Date.now() + LIST_TTL_MS;
    if (p.id) singleCache.set(p.id, { value: p, expiresAt: exp });
    if (p.slug) singleCache.set(p.slug, { value: p, expiresAt: exp });
  }

  return projects;
}

export async function getProject(id: string): Promise<Project | null> {
  // 1. Check single-item cache
  if (isFresh(singleCache.get(id))) {
    return singleCache.get(id)!.value;
  }

  // 2. Check list cache (avoids a network round-trip on back-nav)
  if (isFresh(listCache)) {
    const hit = listCache.value.find((p) => p.id === id || p.slug === id);
    if (hit) return hit;
  }

  // 3. Fetch by UUID first, then by slug.
  // Round 75: only run the .eq("id", …) query when the identifier looks
  // like a UUID — otherwise PostgREST returns 400 ("invalid input syntax
  // for type uuid") for slug-style identifiers (e.g. "straw-hat-zoro"),
  // which spammed the console and short-circuited the slug fallback.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { data: byId, error: idError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!idError && byId) {
      const project = mapProjectRow(byId);
      const [enriched] = await attachOwnerProfiles([project]);
      const exp = Date.now() + LIST_TTL_MS;
      if (enriched.id) singleCache.set(enriched.id, { value: enriched, expiresAt: exp });
      if (enriched.slug) singleCache.set(enriched.slug, { value: enriched, expiresAt: exp });
      return enriched;
    }
  }

  const { data: bySlug, error: slugError } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", id)
    .maybeSingle();

  if (!slugError && bySlug) {
    const project = mapProjectRow(bySlug);
    const [enriched] = await attachOwnerProfiles([project]);
    const exp = Date.now() + LIST_TTL_MS;
    if (enriched.id) singleCache.set(enriched.id, { value: enriched, expiresAt: exp });
    if (enriched.slug) singleCache.set(enriched.slug, { value: enriched, expiresAt: exp });
    return enriched;
  }

  // 4. Fixture fallback
  const fallback = projectFixtures.find(
    (x) => x.id === id || x.slug === id || (x.id ?? "").toString() === id
  );
  if (!fallback) return null;
  const project = mapProjectRow(fallback);
  const [enriched] = await attachOwnerProfiles([project]);
  return enriched;
}

// Create a new project row and return its id
export async function createProject(input: Omit<Project, "id">): Promise<string> {
  const row = projectToInsert(input);

  const { data, error } = await supabase.from("projects").insert(row).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

// Update a project by id
export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  const row = projectToUpdate(patch);
  const { error } = await supabase.from("projects").update(row).eq("id", id);
  if (error) throw error;
}

// Delete a project by id
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Batch-update sort_order for a list of project IDs.
 * The array order determines the new sort_order (index + 1).
 * Clears the in-memory cache after all updates.
 */
export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from("projects").update({ sort_order: index + 1 }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
  clearProjectsCache();
}
