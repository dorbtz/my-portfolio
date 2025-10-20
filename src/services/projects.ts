import { supabase } from "../lib/supabaseClient";
import localData from "../data/projects.json";
import type { Project } from "../types/project";

export async function listProjects(): Promise<Project[]> {
  if (!supabase) return localData as Project[];
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return localData as Project[];
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  // DB path (uuid or any string id stored in id column)
  if (supabase) {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (!error && data) return data as Project;
  }
  // Fallback to local JSON by id
  const p = (localData as Project[]).find((x) => (x.id ?? "").toString() === id);
  return p ?? null;
}

export async function createProject(input: Omit<Project, "id">): Promise<string> { /* unchanged */ }
export async function updateProject(id: string, patch: Partial<Project>) { /* unchanged */ }
export async function deleteProject(id: string) { /* unchanged */ }
