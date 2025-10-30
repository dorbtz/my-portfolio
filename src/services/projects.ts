import { supabase } from "../lib/supabase";
import { projectFixtures } from "../data/projects";
import { mapProjectRow, mapProjectRows, projectToInsert, projectToUpdate } from "../lib/project-mapper";
import type { Project } from "../types/project";
import { getProfilesByIds } from "./profiles";

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
    };
  });
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[projects] Falling back to fixtures", error);
    return projectFixtures.map(mapProjectRow);
  }

  const projects = mapProjectRows(data);
  return attachOwnerProfiles(projects);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data: byId, error: idError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!idError && byId) {
    const project = mapProjectRow(byId);
    const [enriched] = await attachOwnerProfiles([project]);
    return enriched;
  }

  const { data: bySlug, error: slugError } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", id)
    .maybeSingle();

  if (!slugError && bySlug) {
    const project = mapProjectRow(bySlug);
    const [enriched] = await attachOwnerProfiles([project]);
    return enriched;
  }

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
