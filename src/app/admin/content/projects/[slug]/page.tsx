import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GlassCard } from "@/shared/ui/GlassCard";
import { ProjectEditor } from "./ProjectEditor";
import { saveProject, deleteProject, uploadProjectCover } from "./actions";

export const metadata = { title: "Edit project" };

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
  status: string;
  featured: boolean;
  priority: number;
  sort_order: number;
};

const EMPTY: ProjectRow = {
  slug: "",
  title: "",
  subtitle: "",
  problem: "",
  description: "",
  role: "",
  stack: [],
  tags: [],
  cover_url: "",
  live_url: "",
  repo_url: "",
  status: "draft",
  featured: false,
  priority: 10,
  sort_order: 9999,
};

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const isNew = slug === "new";

  let initial: ProjectRow = EMPTY;
  if (!isNew) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "slug,title,subtitle,problem,description,role,stack,tags,cover_url,live_url,repo_url,status,featured,priority,sort_order"
      )
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) notFound();
    initial = data as ProjectRow;
  }

  return (
    <div>
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1 text-body-sm text-muted hover:text-accent transition-colors"
      >
        <span aria-hidden>←</span> All projects
      </Link>
      <p className="text-caption uppercase tracking-[0.18em] text-accent mt-4">
        {isNew ? "New project" : "Edit"}
      </p>
      <h1 className="text-h1 font-bold mt-2">{isNew ? "Create project" : initial.title || initial.slug}</h1>

      <GlassCard padding={6} className="admin-card mt-6">
        <ProjectEditor
          initial={initial}
          isNew={isNew}
          saveAction={saveProject}
          deleteAction={deleteProject}
          uploadAction={uploadProjectCover}
        />
      </GlassCard>
    </div>
  );
}
