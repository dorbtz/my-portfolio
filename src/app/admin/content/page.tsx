import Link from "next/link";
import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GlassCard } from "@/shared/ui/GlassCard";

export const metadata = { title: "Content" };

type ProjectRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  status: string;
  featured: boolean;
  priority: number;
  sort_order: number;
  updated_at: string;
};

const STATUS_TINT: Record<string, string> = {
  shipped: "#10b981",
  "in-progress": "#3b82f6",
  draft: "var(--color-text-muted)",
  archived: "#9ca3af",
};

export default async function AdminContentPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("slug,title,subtitle,status,featured,priority,sort_order,updated_at")
    .order("featured", { ascending: false })
    .order("priority", { ascending: false })
    .order("sort_order", { ascending: true });

  const rows: ProjectRow[] = !error && Array.isArray(data) ? (data as ProjectRow[]) : [];

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Content</p>
      <h1 className="text-h1 font-bold mt-2">Projects + sections</h1>
      <p className="text-body text-muted mt-2">
        Edit project copy, status, and visibility. After saving, run an embeddings
        re-sync on the Health page so the RAG chatbot picks up the new content.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-h2 font-semibold">Projects ({rows.length})</h2>
        <Link
          href="/admin/content/projects/new"
          className="glass-button inline-flex items-center justify-center gap-2 rounded-pill font-medium select-none h-9 px-3 text-body-sm min-h-[44px] bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:brightness-110 transition-[transform,box-shadow,background-color,color] duration-snap ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] active:scale-[0.97]"
        >
          + New project
        </Link>
      </div>

      <ul className="grid gap-3 mt-4">
        {rows.map((p) => {
          const tint = STATUS_TINT[p.status] ?? STATUS_TINT.draft;
          return (
            <li key={p.slug}>
              <Link
                href={`/admin/content/projects/${p.slug}`}
                className="block focus-visible:outline-none rounded-md"
              >
                <GlassCard padding={5} className="transition-transform duration-snap hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-h3 font-semibold truncate">
                        {p.title}{" "}
                        <span className="text-caption text-muted font-normal">/{p.slug}</span>
                      </p>
                      {p.subtitle && (
                        <p className="text-body-sm text-muted truncate mt-0.5">{p.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.featured && (
                        <span className="text-caption text-accent border border-line rounded-pill px-2 py-0.5">
                          ★ featured
                        </span>
                      )}
                      <span
                        className="text-caption px-2 py-0.5 rounded-pill border border-line"
                        style={{ color: tint, borderColor: tint }}
                      >
                        {p.status}
                      </span>
                      <span className="text-caption text-muted">pr {p.priority}</span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
