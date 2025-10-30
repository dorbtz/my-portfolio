import { FormEvent, useEffect, useMemo, useState } from "react";
import { createProject, deleteProject, listProjects, updateProject } from "../../services/projects";
import type { Project, ProjectLink, ProjectMetric, ProjectStatus } from "../../types/project";
import { signOut } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { uploadProjectCover, deleteProjectCover } from "../../services/storage";
import { getProfile, upsertProfile } from "../../services/profiles";

type FormState = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  stackCsv: string;
  tagsCsv: string;
  role: string;
  status: ProjectStatus;
  priority: number;
  sortOrder: number;
  featured: boolean;
  liveUrl: string;
  repoUrl: string;
  coverUrl: string;
  createdAt: string;
  heroImageAlt: string;
  heroVideoUrl: string;
  galleryCsv: string;
  linksText: string;
  metricsText: string;
  responsibilitiesText: string;
  outcomesText: string;
};

const emptyForm: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  stackCsv: "",
  tagsCsv: "",
  role: "",
  status: "draft",
  priority: 1,
  sortOrder: 1,
  featured: false,
  liveUrl: "",
  repoUrl: "",
  coverUrl: "",
  createdAt: new Date().toISOString(),
  heroImageAlt: "",
  heroVideoUrl: "",
  galleryCsv: "",
  linksText: "",
  metricsText: "",
  responsibilitiesText: "",
  outcomesText: "",
};

const STACK_OPTIONS = [
  "React",
  "TypeScript",
  "Supabase",
  "Tailwind CSS",
  "Next.js",
  "Vite",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Framer Motion",
  "Shopify",
  "Liquid",
  "OpenAI",
  "AWS",
  "Vercel",
];

const TAG_OPTIONS = [
  "saas",
  "ai",
  "product",
  "ux",
  "devtools",
  "ecommerce",
  "brand",
  "mobile",
  "realtime",
  "design-system",
  "performance",
  "strategy",
];

const ROLE_OPTIONS = [
  "Founding engineer",
  "Lead engineer & product designer",
  "Product designer",
  "Frontend lead",
  "Tech lead",
  "Full-stack developer",
  "Design technologist",
];

type SuggestionPreset = {
  label: string;
  description: string;
  fields: Partial<FormState>;
};

const SUGGESTION_PRESETS: SuggestionPreset[] = [
  {
    label: "AI workflow suite",
    description: "Polishes copy & structure for an AI-assisted productivity launch.",
    fields: {
      title: "FluxCraft - AI Workflow Studio",
      slug: "fluxcraft",
      subtitle: "Blueprint, automate, and deploy complex team workflows in minutes.",
      summary: "An AI-assisted automation studio that lets teams orchestrate multi-step workflows with versioned prompts, live data sync, and transparent audit trails.",
      description:
        "FluxCraft empowers growth teams to model high-leverage workflows without code. I led the end-to-end build: prompt graph editor, Supabase-backed execution engine, GPT-4 actions, and observability dashboards with percentile latency budgets.",
      stackCsv: "React, TypeScript, Supabase, Tailwind CSS, OpenAI, Vite",
      tagsCsv: "saas, ai, automation, devtools",
      role: "Founding engineer",
      metricsText: "Execution success rate | 98.7%\nMedian run time | 4.1s\nPrompt version latency | <120ms",
      responsibilitiesText:
        "Prompt graph architecture\nRealtime Supabase orchestration\nAI guardrails & evaluation harness\nDesign system + theming",
      outcomesText:
        "Automations shipped 3x faster\nCritical workflows executed 12k/month\nSupport tickets for automation errors down 68%",
    },
  },
  {
    label: "Ecommerce experience",
    description: "Ideal for a polished storefront or Shopify project.",
    fields: {
      title: "Velvet Arcadia Boutique",
      slug: "velvet-arcadia",
      subtitle: "Immersive storytelling storefront with adaptive merchandising and bespoke VIP tiers.",
      summary:
        "A couture retail platform with cinematic product reveals, tiered loyalty flows, and tailored content powered by Shopify Hydrogen and Supabase merchandising rules.",
      description:
        "Built end-to-end experience for a luxury label: adaptive landing layouts, shoppable lookbooks, membership dashboard, and headless checkout instrumentation. Delivered 60fps interactions across devices with aggressive image optimisation.",
      stackCsv: "Shopify, Hydrogen, TypeScript, Tailwind CSS, Supabase, Cloudinary",
      tagsCsv: "ecommerce, brand, performance",
      role: "Frontend lead",
      metricsText: "Conversion rate | +32%\nAverage order value | +18%\nLargest contentful paint | 1.3s",
      responsibilitiesText:
        "Hydrogen storefront architecture\nTiered membership flows\nAnalytics & experimentation setup\nMotion direction + accessibility",
      outcomesText:
        "VIP tier activation doubled in 4 weeks\nContent publishing time dropped to 15 minutes\nWon \"Best Retail Experience\" at ShopAwards",
    },
  },
  {
    label: "Developer platform",
    description: "Quickly scaffold a polished DX/infra case study.",
    fields: {
      title: "SignalForge Platform",
      slug: "signalforge",
      subtitle: "Realtime observability and incident automation for critical infrastructure teams.",
      summary:
        "End-to-end developer platform combining streaming telemetry, automated runbooks, and generative summaries to keep SRE teams ahead of incidents.",
      description:
        "Designed and delivered a multi-tenant observability platform using Supabase Row Level Security, streaming edge workers, and incident copilots. Crafted component-driven UI exposing actionable signal without overload.",
      stackCsv: "React, TypeScript, Supabase, Edge Functions, Tailwind CSS, Framer Motion",
      tagsCsv: "devtools, platform, realtime, observability",
      role: "Tech lead",
      metricsText: "MTTR reduction | 41%\nDashboard load time | 640ms\nADR adoption | 87%",
      responsibilitiesText:
        "Multi-tenant data modelling\nIncident automation workflows\nCommand palette & dashboard UX\nTeam enablement & documentation",
      outcomesText:
        "Incident resolution improved by 41%\nAdopted by 6 enterprise teams in pilot\nRated 4.9/5 satisfaction in DX survey",
    },
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function splitList(value: string, delimiter: RegExp): string[] {
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvList(value: string): string[] {
  if (!value) return [];
  return splitList(value, /[,\\n]+/);
}

function parseMultilineList(value: string): string[] {
  if (!value) return [];
  return splitList(value, /\\n+/);
}

function parseLinksText(value: string): ProjectLink[] {
  if (!value) return [];
  return value
    .split(/\\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes("|") ? line.split("|") : line.split(",");
      const [label, url, icon] = parts.map((segment) => segment.trim());
      if (!label || !url) return null;
      return { label, url, icon: icon || undefined };
    })
    .filter((item): item is ProjectLink => Boolean(item));
}

function parseMetricsText(value: string): ProjectMetric[] {
  if (!value) return [];
  return value
    .split(/\\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes("|") ? line.split("|") : line.split(":");
      const [label, metricValue] = parts.map((segment) => segment.trim());
      if (!label || !metricValue) return null;
      return { label, value: metricValue };
    })
    .filter((item): item is ProjectMetric => Boolean(item));
}

function formatLinksText(links?: ProjectLink[] | null): string {
  if (!links?.length) return "";
  return links
    .map((link) => [link.label, link.url, link.icon].filter(Boolean).join(" | "))
    .join("\n");
}

function formatMetricsText(metrics?: ProjectMetric[] | null): string {
  if (!metrics?.length) return "";
  return metrics.map((metric) => `${metric.label} | ${metric.value}`).join("\n");
}

export default function ProjectsAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ ...emptyForm, createdAt: new Date().toISOString() });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(form.id);
  const [uploading, setUploading] = useState(false);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

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

  useEffect(() => {
    let active = true;
    async function hydrateProfile(userId: string) {
      try {
        const data = await getProfile(userId);
        if (!active) return;
        setProfileUsername(data?.username ?? "");
        setProfileDisplayName(data?.display_name ?? "");
      } catch (err) {
        if (!active) return;
        console.warn("[admin] failed to load profile", err);
      }
    }
    if (user?.id) {
      hydrateProfile(user.id);
    } else {
      setProfileUsername("");
      setProfileDisplayName("");
    }
    return () => {
      active = false;
    };
  }, [user?.id]);

  const onProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      const updated = await upsertProfile(user.id, {
        username: profileUsername,
        displayName: profileDisplayName,
      });
      setProfileUsername(updated?.username ?? "");
      setProfileDisplayName(updated?.display_name ?? "");
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [
        p.title,
        p.subtitle,
        p.summary,
        p.description,
        ...(p.stack ?? []),
        ...(p.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const stack = parseCsvList(form.stackCsv);
    const tags = parseCsvList(form.tagsCsv);
    const gallery = parseCsvList(form.galleryCsv);
    const responsibilities = parseMultilineList(form.responsibilitiesText);
    const outcomes = parseMultilineList(form.outcomesText);
    const links = parseLinksText(form.linksText);
    const metrics = parseMetricsText(form.metricsText);

    const payload: Omit<Project, "id"> = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      stack,
      tech: stack,
      tags,
      role: form.role.trim(),
      status: form.status,
      priority: form.priority,
      sortOrder: form.sortOrder,
      featured: form.featured,
      liveUrl: form.liveUrl.trim() || undefined,
      repoUrl: form.repoUrl.trim() || undefined,
      coverUrl: form.coverUrl.trim(),
      createdAt: form.createdAt,
      heroImageAlt: form.heroImageAlt.trim() || undefined,
      heroVideoUrl: form.heroVideoUrl.trim() || undefined,
      gallery: gallery.length ? gallery : undefined,
      links: links.length ? links : undefined,
      metrics: metrics.length ? metrics : undefined,
      responsibilities: responsibilities.length ? responsibilities : undefined,
      outcomes: outcomes.length ? outcomes : undefined,
      owner: user?.id ?? null,
      ownerUsername: profileUsername || undefined,
      ownerDisplayName: profileDisplayName || undefined,
    };
    try {
      if (editing && form.id) {
        await updateProject(form.id, {
          ...payload,
        });
      } else {
        const id = await createProject(payload);
        setForm((f) => ({ ...f, id }));
      }
      await load();
      setForm({ ...emptyForm, createdAt: new Date().toISOString() });
    } catch (e: any) {
      setError(e.message || "Save failed (check RLS/auth)");
    }
  }

  async function onEdit(p: Project) {
    setForm({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      summary: p.summary,
      description: p.description,
      stackCsv: ((p.stack && p.stack.length ? p.stack : p.tech ?? [])).join(", "),
      tagsCsv: (p.tags ?? []).join(", "),
      role: p.role ?? "",
      status: p.status,
      priority: p.priority,
      sortOrder: p.sortOrder ?? p.priority ?? 0,
      featured: p.featured,
      liveUrl: p.liveUrl ?? "",
      repoUrl: p.repoUrl ?? "",
      coverUrl: p.coverUrl ?? "",
      createdAt: p.createdAt,
      heroImageAlt: p.heroImageAlt ?? "",
      heroVideoUrl: p.heroVideoUrl ?? "",
      galleryCsv: (p.gallery ?? []).join(", "),
      linksText: formatLinksText(p.links),
      metricsText: formatMetricsText(p.metrics),
      responsibilitiesText: (p.responsibilities ?? []).join("\n"),
      outcomesText: (p.outcomes ?? []).join("\n"),
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

      {user ? (
        <section className="mb-6 rounded-2xl border border-white/10 p-4 md:p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">Your author profile</h2>
            <p className="text-xs text-white/65 md:text-sm">
              These details appear on project pages. Pick a username to show as the project owner and a display name for friendlier attribution.
            </p>
          </div>
          <form onSubmit={onProfileSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-white/70">Display name</span>
              <input
                value={profileDisplayName}
                onChange={(e) => {
                  setProfileDisplayName(e.target.value);
                  setProfileMessage(null);
                  setProfileError(null);
                }}
                placeholder="e.g. Dor Ben Tzur"
                className="rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm focus:border-cyan-300/60 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/70">Username</span>
              <input
                value={profileUsername}
                onChange={(e) => {
                  setProfileUsername(e.target.value);
                  setProfileMessage(null);
                  setProfileError(null);
                }}
                placeholder="your-handle"
                className="rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm focus:border-cyan-300/60 focus:outline-none"
              />
              <span className="text-[11px] text-white/40">Shown as the project owner when available.</span>
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-lg border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-sm text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
              {profileMessage ? <span className="text-xs text-emerald-300/80">{profileMessage}</span> : null}
              {profileError ? <span className="text-xs text-rose-300/80">{profileError}</span> : null}
            </div>
          </form>
        </section>
      ) : null}

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 p-4 md:p-5">
        <h2 className="text-lg font-medium">{editing ? "Edit project" : "Create new project"}</h2>
        <p className="mt-1 text-xs text-white/60">
          Fill in the fields manually or start from a smart preset below. Presets are handcrafted patterns tailored for high-impact case studies.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-cyan-400/60 hover:text-white"
              onClick={() => {
                setForm((prev) => {
                  const next = { ...prev };
                  const entries = Object.entries(preset.fields) as Array<[keyof FormState, FormState[keyof FormState]]>;
                  entries.forEach(([key, value]) => {
                    if (value !== undefined) {
                      next[key] = value;
                    }
                  });
                  if (!next.slug && preset.fields.title) {
                    next.slug = preset.fields.slug ?? slugify(preset.fields.title);
                  }
                  if (preset.fields.title && prev.slug === slugify(prev.title)) {
                    next.slug = preset.fields.slug ?? slugify(preset.fields.title);
                  }
                  return next;
                });
              }}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70 transition hover:border-cyan-400/60 hover:text-white"
            onClick={() => {
              setForm((prev) => {
                const next = { ...prev };
                if (prev.title.trim()) {
                  next.slug = slugify(prev.title);
                }
                return next;
              });
            }}
          >
            Auto slug from title
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Slug</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={() => {
                if (!form.slug.trim() && form.title.trim()) {
                  setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
                }
              }}
            />
          </label>
          <label className="block">
            <span className="text-sm">Subtitle</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Status</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              <option value="draft">Draft</option>
              <option value="in-progress">In progress</option>
              <option value="shipped">Shipped</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Summary</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={2}
              required
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Description</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Stack (comma separated)</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              placeholder="React, TypeScript, Tailwind"
              value={form.stackCsv}
              list="stack-options"
              onChange={(e) => setForm({ ...form, stackCsv: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Tags (comma separated)</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              placeholder="saas, product, ux"
              value={form.tagsCsv}
              list="tag-options"
              onChange={(e) => setForm({ ...form, tagsCsv: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Role</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.role}
              list="role-options"
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Priority</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Sort order</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
            <span className="mt-1 block text-xs text-white/50">Lower numbers appear first on the projects page.</span>
          </label>
          <label className="block">
            <span className="text-sm">Featured</span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-white/20"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <span className="text-xs opacity-70">Surface in featured carousels</span>
            </div>
          </label>
          <label className="block">
            <span className="text-sm">Repo URL</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.repoUrl}
              onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Live URL (optional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.liveUrl}
              onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
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
                    const uid = (window as any).__supabase_uid || null;
                    const realUid = (user && (user as any).id) || uid;
                    if (!realUid) throw new Error("Not authenticated");
                    if (lastUploadedPath) {
                      try {
                        await deleteProjectCover(lastUploadedPath);
                      } catch {}
                      setLastUploadedPath(null);
                    }

                    const { path, url } = await uploadProjectCover(file, realUid);
                    setLastUploadedPath(path);
                    setForm((f) => ({ ...f, coverUrl: url }));
                  } catch (err: any) {
                    alert(err.message || "Upload failed");
                  } finally {
                    setUploading(false);
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
              value={form.coverUrl}
              onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            />

            {form.coverUrl ? (
              <div className="mt-2">
                <img
                  src={form.coverUrl}
                  alt="Cover preview"
                  className="max-h-32 rounded-lg border border-white/10 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Hero image alt text</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              placeholder="Describe the cover image"
              value={form.heroImageAlt}
              onChange={(e) => setForm({ ...form, heroImageAlt: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Hero video URL (optional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              placeholder="https://cdn.example.com/hero.mp4 or YouTube embed URL"
              value={form.heroVideoUrl}
              onChange={(e) => setForm({ ...form, heroVideoUrl: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Gallery media (comma or newline separated)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={2}
              placeholder="https://.../shot-1.webp, https://.../shot-2.webp"
              value={form.galleryCsv}
              onChange={(e) => setForm({ ...form, galleryCsv: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Additional links (one per line, format: Label | URL | optional icon)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={3}
              placeholder="Case study | https://...\nDribbble | https://... | dribbble"
              value={form.linksText}
              onChange={(e) => setForm({ ...form, linksText: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Metrics (one per line, format: Label | Value)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={3}
              placeholder="MRR | $18k\nLatency | <60ms"
              value={form.metricsText}
              onChange={(e) => setForm({ ...form, metricsText: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Responsibilities (one per line)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={3}
              placeholder="Product discovery & direction&#10;AI workflow architecture"
              value={form.responsibilitiesText}
              onChange={(e) => setForm({ ...form, responsibilitiesText: e.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm">Outcomes (one per line)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              rows={3}
              placeholder="Reduced onboarding from 15 to 3 minutes"
              value={form.outcomesText}
              onChange={(e) => setForm({ ...form, outcomesText: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm">Created at</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm"
              value={form.createdAt ? form.createdAt.slice(0, 16) : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  createdAt: e.target.value ? new Date(e.target.value).toISOString() : form.createdAt,
                })
              }
            />
          </label>
        </div>
        <datalist id="stack-options">
          {STACK_OPTIONS.map((option) => (
            <option value={option} key={option} />
          ))}
        </datalist>
        <datalist id="tag-options">
          {TAG_OPTIONS.map((option) => (
            <option value={option} key={option} />
          ))}
        </datalist>
        <datalist id="role-options">
          {ROLE_OPTIONS.map((option) => (
            <option value={option} key={option} />
          ))}
        </datalist>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" data-thor-hover
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            {editing ? "Save changes" : "Create project"}
          </button>
          {editing && (
            <button
            type="button"
            onClick={() => {
                setForm({ ...emptyForm, createdAt: new Date().toISOString() });
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
            <li key={p.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs opacity-70">
                  {p.slug} · {p.status} · {p.repoUrl || "No repo"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>onEdit(p)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5" data-thor-hover>
                  Edit
                </button>
                <button onClick={()=>onDelete(p.id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
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

