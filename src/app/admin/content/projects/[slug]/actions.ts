"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export type ProjectInput = {
  slug: string;
  title: string;
  subtitle: string;
  problem: string;
  description: string;
  role: string;
  stack: string[];
  tags: string[];
  live_url: string;
  repo_url: string;
  status: "draft" | "in-progress" | "shipped" | "archived";
  featured: boolean;
  priority: number;
  sort_order: number;
};

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function sanitize(input: ProjectInput): ProjectInput {
  return {
    ...input,
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    problem: input.problem.trim(),
    description: input.description.trim(),
    role: input.role.trim(),
    stack: input.stack.map((s) => s.trim()).filter(Boolean),
    tags: input.tags.map((s) => s.trim()).filter(Boolean),
    live_url: input.live_url.trim(),
    repo_url: input.repo_url.trim(),
    priority: Number.isFinite(input.priority) ? Math.max(0, Math.min(100, input.priority)) : 0,
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 9999,
  };
}

export async function saveProject(input: ProjectInput, isNew: boolean): Promise<SaveResult> {
  await requireAdmin();
  const clean = sanitize(input);

  if (!clean.slug || !SLUG_RE.test(clean.slug)) {
    return { ok: false, error: "Slug must be lowercase, alphanumeric + dashes (e.g. 'lumen', 'project-x')." };
  }
  if (!clean.title) return { ok: false, error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const row = {
    slug: clean.slug,
    title: clean.title,
    subtitle: clean.subtitle || null,
    problem: clean.problem,
    description: clean.description || null,
    role: clean.role || null,
    stack: clean.stack,
    tags: clean.tags,
    live_url: clean.live_url || null,
    repo_url: clean.repo_url || null,
    status: clean.status,
    featured: clean.featured,
    priority: clean.priority,
    sort_order: clean.sort_order,
    updated_at: new Date().toISOString(),
  };

  if (isNew) {
    const { error } = await supabase.from("projects").insert(row);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("projects").update(row).eq("slug", clean.slug);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${clean.slug}`);
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/projects/${clean.slug}`);
  revalidatePath("/admin");
  return { ok: true, slug: clean.slug };
}

export async function deleteProject(slug: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!slug || !SLUG_RE.test(slug)) return { ok: false, error: "Invalid slug." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("projects").delete().eq("slug", slug);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  redirect("/admin/content");
}
