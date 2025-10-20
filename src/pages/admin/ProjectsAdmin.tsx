import { useEffect, useMemo, useState } from "react";
import { createProject, deleteProject, listProjects, updateProject } from "../../services/projects";
import type { Project } from "../../types/project";
import { signOut } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { uploadProjectCover, deleteProjectCover } from "../../services/storage";

type FormState = {
  id?: string;
  title: string;
  summary: string;
  techCsv: string;     // comma-separated for convenience
  repo_url: string;
  live_url?: string;
  cover_url?: string;
  sort_order?: number;
};

const emptyForm: FormState = {
  title: "",
  summary: "",
  techCsv: "",
  repo_url: "",
  live_url: "",
  cover_url: "",
  sort_order: 9999,
};

export default function ProjectsAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(form.id);
  const [uploading, setUploading] = useState(false);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(p => (p.title + " " + p.summary + " " + (p.tech||[]).join(" ")).toLowerCase().includes(q));
  }, [items, query]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Omit<Project, "id"> = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      tech: form.techCsv.split(",").map(s => s.trim()).filter(Boolean),
      repo_url: form.repo_url.trim(),
      live_url: form.live_url?.trim() || undefined,
      cover_url: form.cover_url?.trim() || undefined,
      highlight: (undefined as any), // ignored by DB, harmless for typing
    };
    try {
      if (editing && form.id) {
        await updateProject(form.id, {
          ...payload,
          sort_order: form.sort_order ?? 9999,
        } as any);
      } else {
        const id = await createProject({
          ...payload,
          sort_order: form.sort_order ?? 9999,
        } as any);
        setForm((f) => ({ ...f, id }));
      }
      await load();
      setForm({ ...emptyForm });
    } catch (e: any) {
      setError(e.message || "Save failed (check RLS/auth)");
    }
  }

  async function onEdit(p: Project) {
    setForm({
      id: (p as any).id,
      title: p.title,
      summary: p.summary,
      techCsv: (p.tech || []).join(", "),
      repo_url: p.repo_url,
      live_url: p.live_url || "",
      cover_url: p.cover_url || "",
      sort_order: (p as any).sort_order ?? 9999,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject(id);
      await load();
    } catch (e: any) {
      setError(e.message || "Delete failed (check RLS/auth)");
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects Admin</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">{user?.email}</span>
          <button onClick={() => signOut()} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5" data-thor-hover>
            Sign out
          </button>
        </div>
      </header>

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 p-4 md:p-5">
        <h2 className="text-lg font-medium">{editing ? "Edit project" : "Create new project"}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Title</span>
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm" required
              value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
          </label>
          <label className="block">
            <span className="text-sm">Repo URL</span>
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm" required
              value={form.repo_url} onChange={(e)=>setForm({...form,repo_url:e.target.value})}/>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Summary</span>
            <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm" rows={3} required
              value={form.summary} onChange={(e)=>setForm({...form,summary:e.target.value})}/>
          </label>
          <label className="block">
            <span className="text-sm">Live URL (optional)</span>
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.live_url} onChange={(e)=>setForm({...form,live_url:e.target.value})}/>
          </label>
            <label className="block">
            <span className="text-sm">Cover image</span>
            <div className="mt-1 flex items-center gap-3">
                <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                    // Require auth (you are logged in here)
                    // We need your uid to namespace the path
                    const uid = (window as any).__supabase_uid || null;
                    // Fallback: read from auth context if you prefer:
                    // const uid = user?.id || null;
                    const realUid = (user && (user as any).id) || uid;
                    if (!realUid) throw new Error("Not authenticated");

                    // If you previously uploaded in this edit session, optionally delete it
                    // (so you don't leave orphans when replacing)
                    if (lastUploadedPath) {
                        try { await deleteProjectCover(lastUploadedPath); } catch {}

                        setLastUploadedPath(null);
                    }

                    const { path, url } = await uploadProjectCover(file, realUid);
                    setLastUploadedPath(path);
                    setForm((f) => ({ ...f, cover_url: url }));
                    } catch (err: any) {
                    alert(err.message || "Upload failed");
                    } finally {
                    setUploading(false);
                    // reset input so same file can be re-selected if needed
                    e.currentTarget.value = "";
                    }
                }}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-1.5 file:text-sm hover:file:bg-white/10"
                />
                <span className="text-xs opacity-70">{uploading ? "Uploading…" : ""}</span>
            </div>

            <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
                placeholder="Or paste an image URL"
                value={form.cover_url}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
            />

            {form.cover_url ? (
                <div className="mt-2">
                <img
                    src={form.cover_url}
                    alt="Cover preview"
                    className="max-h-32 rounded-lg border border-white/10 object-cover"
                    loading="lazy"
                    decoding="async"
                />
                </div>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm">Tech (comma separated)</span>
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              placeholder="React, TypeScript, Tailwind v4"
              value={form.techCsv} onChange={(e)=>setForm({...form,techCsv:e.target.value})}/>
          </label>
          <label className="block">
            <span className="text-sm">Sort order (lower first)</span>
            <input type="number" className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.sort_order ?? 9999} onChange={(e)=>setForm({...form,sort_order:Number(e.target.value)})}/>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" data-thor-hover
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            {editing ? "Save changes" : "Create project"}
          </button>
          {editing && (
            <button
            type="button"
            onClick={() => {
                setForm({ ...emptyForm });
                setLastUploadedPath(null);
            }}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
            Cancel
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </form>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-medium">All projects</h2>
        <input
          type="search" placeholder="Filter…"
          className="w-64 rounded-lg border border-white/10 bg-white/2 px-3 py-1.5 text-sm"
          value={query} onChange={(e)=>setQuery(e.target.value)}
        />
      </div>

      <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
        {loading ? (
          <li className="p-4 text-sm opacity-70">Loading…</li>
        ) : filtered.length ? (
          filtered.map((p) => (
            <li key={(p as any).id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs opacity-70">{p.repo_url}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>onEdit(p)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5" data-thor-hover>
                  Edit
                </button>
                <button onClick={()=>onDelete((p as any).id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="p-4 text-sm opacity-70">No projects yet.</li>
        )}
      </ul>
    </div>
  );
}
