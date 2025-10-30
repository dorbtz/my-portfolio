import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../../services/projects";
import { updateProject } from "../../services/projects";
import type { Project, ProjectLink, ProjectMetric, ProjectStatus } from "../../types/project";
import { setPageMeta } from "../../lib/seo";
import ImageFallback from "../../components/ImageFallback";
import { useGithubBadge } from "../../hooks/useGithubBadge";
import { ProjectActionButton } from "../../components/ProjectActionButton";
import { iconForProjectLink } from "../../components/projectActionHelpers";
import { useAuth } from "../../hooks/useAuth";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, DATE_FORMAT);
}

function uniqueList(items?: string[]) {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.filter(Boolean)));
}

function filterLinks(links?: ProjectLink[] | null): ProjectLink[] {
  if (!Array.isArray(links)) return [];
  return links.filter((link) => Boolean(link?.label && link?.url));
}

function filterMetrics(metrics?: ProjectMetric[] | null): ProjectMetric[] {
  if (!Array.isArray(metrics)) return [];
  return metrics.filter((metric) => Boolean(metric?.label && metric?.value));
}

const STATUS_OPTIONS: ProjectStatus[] = ["draft", "in-progress", "shipped", "archived"];

function toCsv(list?: string[] | null): string {
  if (!Array.isArray(list) || !list.length) return "";
  return list.join(", ");
}

function toMultiline(list?: string[] | null): string {
  if (!Array.isArray(list) || !list.length) return "";
  return list.join("\n");
}

function toMetricsText(metrics?: ProjectMetric[] | null): string {
  if (!Array.isArray(metrics) || !metrics.length) return "";
  return metrics
    .map((metric) => `${metric.label} | ${metric.value}`)
    .join("\n");
}

function toLinksText(links?: ProjectLink[] | null): string {
  if (!Array.isArray(links) || !links.length) return "";
  return links
    .map((link) => {
      const icon = link.icon ? ` | ${link.icon}` : "";
      return `${link.label} | ${link.url}${icon}`;
    })
    .join("\n");
}

function parseCsv(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMultiline(value: string): string[] {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMetrics(value: string): ProjectMetric[] {
  return parseMultiline(value)
    .map((line) => {
      const [label, rawValue] = line.split("|").map((part) => part.trim());
      if (!label || !rawValue) return null;
      return { label, value: rawValue };
    })
    .filter((item): item is ProjectMetric => Boolean(item));
}

function parseLinks(value: string): ProjectLink[] {
  return parseMultiline(value)
    .map((line) => {
      const [label, url, icon] = line.split("|").map((part) => part.trim());
      if (!label || !url) return null;
      return { label, url, icon: icon || undefined };
    })
    .filter((item): item is ProjectLink => Boolean(item));
}

type ProjectEditState = {
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  status: ProjectStatus;
  priority: string;
  featured: boolean;
  role: string;
  liveUrl: string;
  repoUrl: string;
  heroImageAlt: string;
  heroVideoUrl: string;
  coverUrl: string;
  stackCsv: string;
  tagsCsv: string;
  responsibilitiesText: string;
  outcomesText: string;
  metricsText: string;
  linksText: string;
  galleryCsv: string;
  createdAt: string;
};

function projectToEditState(project: Project): ProjectEditState {
  return {
    title: project.title ?? "",
    subtitle: project.subtitle ?? "",
    summary: project.summary ?? "",
    description: project.description ?? "",
    status: project.status ?? "draft",
    priority: String(project.priority ?? 0),
    featured: Boolean(project.featured),
    role: project.role ?? "",
    liveUrl: project.liveUrl ?? "",
    repoUrl: project.repoUrl ?? "",
    heroImageAlt: project.heroImageAlt ?? "",
    heroVideoUrl: project.heroVideoUrl ?? "",
    coverUrl: project.coverUrl ?? "",
    stackCsv: toCsv(project.stack),
    tagsCsv: toCsv(project.tags),
    responsibilitiesText: toMultiline(project.responsibilities),
    outcomesText: toMultiline(project.outcomes),
    metricsText: toMetricsText(project.metrics),
    linksText: toLinksText(project.links),
    galleryCsv: toCsv(project.gallery),
    createdAt: project.createdAt ?? "",
  };
}

function formatStatusLabel(status?: Project["status"]) {
  if (!status) return "Draft";
  return status.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeText(value?: string | null, fallback = "N/A") {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : fallback;
}

type HeroMediaItem = {
  key: string;
  element: JSX.Element;
};

export default function ProjectDetail() {
  const { id: legacyId, slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { count: ghCount, label: ghLabel } = useGithubBadge(project?.repoUrl);
  const { user } = useAuth();
  const canEdit = Boolean(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<ProjectEditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const identifier = slug ?? legacyId;
      const next = identifier ? await getProject(identifier) : null;
      if (!cancel) {
        setProject(next);
        setLoading(false);
        if (next) {
          setPageMeta({
            title: `${next.title} -> Case Study`,
            description: next.summary,
            image: next.coverUrl,
            url: next.slug ? `${window.location.origin}/projects/${next.slug}` : window.location.href,
          });
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [slug, legacyId]);

  useEffect(() => {
    if (!isEditing || !project) return;
    setEditState(projectToEditState(project));
    setSaveError(null);
    setSaveSuccess(null);
  }, [isEditing, project]);

  const openEditor = () => {
    if (!project) return;
    setEditState(projectToEditState(project));
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const updateField = <T extends keyof ProjectEditState>(field: T, value: ProjectEditState[T]) => {
    setEditState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project?.id || !editState) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const patch: Partial<Project> = {
        title: editState.title.trim(),
        subtitle: editState.subtitle.trim(),
        summary: editState.summary.trim(),
        description: editState.description.trim(),
        status: editState.status,
        priority: Number.parseInt(editState.priority, 10) || 0,
        featured: editState.featured,
        role: editState.role.trim(),
        liveUrl: editState.liveUrl.trim(),
        repoUrl: editState.repoUrl.trim(),
        heroImageAlt: editState.heroImageAlt.trim(),
        heroVideoUrl: editState.heroVideoUrl.trim(),
        coverUrl: editState.coverUrl.trim(),
        stack: parseCsv(editState.stackCsv),
        tags: parseCsv(editState.tagsCsv),
        responsibilities: parseMultiline(editState.responsibilitiesText),
        outcomes: parseMultiline(editState.outcomesText),
        metrics: parseMetrics(editState.metricsText),
        links: parseLinks(editState.linksText),
        gallery: parseCsv(editState.galleryCsv),
        owner: user?.id ?? project.owner ?? null,
      };

      if (editState.createdAt.trim()) {
        const timestamp = new Date(editState.createdAt);
        if (!Number.isNaN(timestamp.getTime())) {
          patch.createdAt = timestamp.toISOString();
        }
      }

      await updateProject(project.id, patch);
      const refreshed = await getProject(project.id);
      if (refreshed) {
        setProject(refreshed);
      } else {
        setProject((prev) => (prev ? { ...prev, ...patch } : prev));
      }
      setSaveSuccess("Project updated successfully.");
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-white/70">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white/80">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-3 text-sm text-white/60">
          The case study you are looking for does not exist or is private.
        </p>
        <Link
          to="/#projects"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-100"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const title = project.title?.trim() || "Untitled project";
  const statusLabel = formatStatusLabel(project.status);
  const hasLiveDemo = Boolean(project.liveUrl);
  const hasRepo = Boolean(project.repoUrl);
  const galleryItems = uniqueList(project.gallery);
  const responsibilities = uniqueList(project.responsibilities);
  const outcomes = uniqueList(project.outcomes);
  const stack = uniqueList(project.stack);
  const tech = uniqueList(project.tech);
  const extraTech = tech.filter((item) => !stack.includes(item));
  const additionalLinks = filterLinks(project.links);
  const metrics = filterMetrics(project.metrics);
  const heroVideo = safeText(project.heroVideoUrl, "");
  const heroCover = project.coverUrl;
  const createdDisplay = formatDate(project.createdAt);
  const updatedDisplay = formatDate(project.updatedAt);
  const heroSummary = (project.summary ?? project.description ?? "").trim();
  const summaryDisplay = heroSummary || "No summary yet. Think of this as the trailer.";
  const overviewCopy = project.description?.trim();
  const overviewDisplay =
    overviewCopy || "No overview yet. It is on the to-do list right after 'ship awesome things'.";


  const ownerLabel = project.ownerDisplayName?.trim() || project.ownerUsername?.trim() || null;
  const wasUpdated = Boolean(project.updatedAt && project.updatedAt !== project.createdAt);
  const resourceLinks = additionalLinks.slice(2);
  const quickFacts: Array<{ label: string; value: string }> = [
    { label: "Role", value: safeText(project.role, "N/A") },
    { label: "Status", value: statusLabel },
    { label: "Owner", value: ownerLabel ?? "Not assigned" },
  ];
  if (wasUpdated && updatedDisplay) {
    quickFacts.push({ label: "Last updated", value: updatedDisplay });
  } else if (!wasUpdated && createdDisplay) {
    quickFacts.push({ label: "Created", value: createdDisplay });
  }

  const heroMedia: HeroMediaItem[] = [];
  if (heroVideo) {
    const isFile = /\.(mp4|mov)(\?.*)?$/i.test(heroVideo);
    heroMedia.push({
      key: "hero-video",
      element: (
        <div className="overflow-hidden rounded-[28px] border border-white/12 bg-black/40 shadow-surface">
          {isFile ? (
            <video src={heroVideo} controls preload="metadata" className="h-full w-full" />
          ) : (
            <iframe
              src={heroVideo}
              title={`${title} hero video`}
              className="h-full w-full"
              loading="lazy"
              allow="autoplay; fullscreen; encrypted-media"
            />
          )}
        </div>
      ),
    });
  }
  if (heroCover) {
    heroMedia.push({
      key: "hero-cover",
      element: (
        <ImageFallback
          src={heroCover}
          alt={project.heroImageAlt || `${title} cover`}
          rounded="rounded-[28px]"
          aspect="golden"
          className="border border-white/12 bg-black/20 shadow-surface"
        />
      ),
    });
  }

  const primaryMedia = heroMedia[0];
  const secondaryMedia = heroMedia.slice(1);

  return (
    <article className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 pb-16 pt-14 text-white sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
      <div
        className="pointer-events-none absolute inset-x-8 top-24 -z-10 hidden h-[560px] rounded-[48px] bg-gradient-to-br from-cyan-400/15 via-purple-500/12 to-transparent blur-3xl sm:block lg:inset-x-14 lg:h-[620px]"
        aria-hidden
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-100"
        >
          <span>Back to projects</span>
        </Link>
        {wasUpdated && updatedDisplay ? (
          <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-white/60">
            Updated {updatedDisplay}
          </span>
        ) : null}
        {!wasUpdated && createdDisplay ? (
          <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-white/60">
            Created {createdDisplay}
          </span>
        ) : null}
      </div>

      <header className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-10">
        <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/5 p-6 shadow-surface sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-white/[0.03]" aria-hidden />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/60">
              <span className="rounded-full border border-white/15 bg-black/40 px-2 py-1">{statusLabel}</span>
              <span className="rounded-full border border-white/15 bg-black/40 px-2 py-1">
                Priority {project.priority ?? 0}
              </span>
              {project.featured ? (
                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-1 text-amber-100">
                  Featured
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
              {project.subtitle ? <p className="text-lg text-white/70">{project.subtitle}</p> : null}
            </div>

            <p className="text-base leading-7 text-white/80 sm:text-lg sm:leading-8">{summaryDisplay}</p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {hasLiveDemo ? (
                <ProjectActionButton href={project.liveUrl!} label="Live site" icon="external" />
              ) : null}
              {hasRepo ? (
                <ProjectActionButton href={project.repoUrl!} label="Source code" icon="github" />
              ) : null}
              {additionalLinks.slice(0, 2).map((link) => (
                <ProjectActionButton
                  key={link.url}
                  href={link.url}
                  label={link.label}
                  icon={iconForProjectLink(link)}
                />
              ))}
            </div>

            {canEdit ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openEditor}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
                >
                  Edit project
                </button>
                {saveSuccess ? (
                  <span className="text-xs text-emerald-300/80">{saveSuccess}</span>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs uppercase tracking-wide text-white/50">
              Quick stats live in the sidebar. Scroll if you want the nerdy bits.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:gap-7">
          {primaryMedia ? (
            <div key={primaryMedia.key}>{primaryMedia.element}</div>
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/4 text-sm text-white/60">
              Hero media is on coffee break. Picture something epic.
            </div>
          )}
          {secondaryMedia.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {secondaryMedia.map((media) => (
                <div key={media.key}>{media.element}</div>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <div className="flex flex-col gap-8 lg:gap-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/15 text-sm text-cyan-100">
                i
              </div>
              <h2 className="text-xl font-semibold">Overview</h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-base leading-7 text-white/80">{overviewDisplay}</p>
          </div>

          {metrics.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-300/15 text-sm text-emerald-100">
                  %
                </div>
                <h2 className="text-xl font-semibold">Impact highlights</h2>
              </div>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:gap-5">
                {metrics.map((metric) => (
                  <li
                    key={metric.label}
                    className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-white"
                  >
                    <div className="text-xs uppercase tracking-wide text-white/70">{metric.label}</div>
                    <div className="mt-1 text-xl font-semibold">{metric.value}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {responsibilities.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
              <h2 className="text-xl font-semibold">Responsibilities</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/80">
                {responsibilities.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 block h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {outcomes.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
              <h2 className="text-xl font-semibold">Outcomes</h2>
              <ul className="mt-4 space-y-2 text-sm font-medium text-white">
                {outcomes.map((item) => (
                  <li key={item} className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {resourceLinks.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
              <h2 className="text-xl font-semibold">Resources</h2>
              <p className="mt-2 text-sm text-white/60">Bonus links for the curious.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {resourceLinks.map((link) => (
                  <ProjectActionButton
                    key={link.url}
                    href={link.url}
                    label={link.label}
                    icon={iconForProjectLink(link)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {galleryItems.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-surface sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Gallery</h2>
                <span className="text-xs uppercase tracking-wide text-white/50">
                  {galleryItems.length} item{galleryItems.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <ImageFallback
                    key={item}
                    src={item}
                    alt={`${title} gallery item`}
                    rounded="rounded-2xl"
                    aspect="square"
                    className="border border-white/10 bg-black/20"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="mt-4 flex flex-col gap-6 lg:sticky lg:top-28 lg:mt-0 lg:gap-8">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/6 p-6 shadow-surface sm:p-7">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Quick info</h3>
              <p className="text-xs text-white/50">Snack-size stats for speedy readers.</p>
            </div>
            <dl className="space-y-3 text-sm text-white/80">
              {quickFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs uppercase tracking-wide text-white/50">{fact.label}</dt>
                  <dd className="mt-1 text-white/80">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {ghCount !== null && ghLabel ? (
              <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-2 text-xs text-white/80">
                {ghLabel}: <span className="font-semibold text-white">{ghCount}</span>
              </div>
            ) : null}
            {!quickFacts.length ? (
              <p className="text-xs text-white/50">
                No quick facts yet. The project is apparently living that mysterious life.
              </p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/6 p-6 shadow-surface sm:p-7">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Stack</h3>
            {stack.length ? (
              <ul className="flex flex-wrap gap-1.5 text-xs text-white/70">
                {stack.map((item) => (
                  <li key={item} className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 uppercase tracking-wide">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/50">No stack listed yet. Maybe it is powered by coffee.</p>
            )}
            {extraTech.length ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-white/45">Supporting tech</div>
                <ul className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-white/60">
                  {extraTech.map((item) => (
                    <li key={item} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/6 p-6 shadow-surface sm:p-7">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Tags</h3>
            {project.tags?.length ? (
              <ul className="flex flex-wrap gap-1.5 text-[11px] text-white/60">
                {project.tags.map((tag) => (
                  <li key={tag} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/50">No tags yet. Add some flair when you are ready.</p>
            )}
          </div>
        </aside>
      </section>

      {canEdit && isEditing && editState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close editor"
            onClick={closeEditor}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-[91] w-full max-w-4xl rounded-[28px] border border-white/15 bg-[#050714]/95 p-6 text-left shadow-[0_40px_160px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit project</h2>
                <p className="mt-1 text-sm text-white/60">
                  Update the case study content, then save to sync with Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close editor"
              >
                ✕
              </button>
            </div>

            <form className="mt-5 grid max-h-[70vh] gap-5 overflow-y-auto pr-1 text-sm text-white/85 sm:text-base" onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Title</span>
                  <input
                    value={editState.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Subtitle</span>
                  <input
                    value={editState.subtitle}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Summary</span>
                <textarea
                  value={editState.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  rows={3}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Overview copy</span>
                <textarea
                  value={editState.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Status</span>
                  <select
                    value={editState.status}
                    onChange={(e) => updateField("status", e.target.value as ProjectStatus)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Priority</span>
                  <input
                    type="number"
                    value={editState.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={editState.featured}
                    onChange={(e) => updateField("featured", e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/5 accent-cyan-300/80"
                  />
                  Featured project
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Role</span>
                  <input
                    value={editState.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Live URL</span>
                  <input
                    value={editState.liveUrl}
                    onChange={(e) => updateField("liveUrl", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Repo URL</span>
                  <input
                    value={editState.repoUrl}
                    onChange={(e) => updateField("repoUrl", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Cover image URL</span>
                  <input
                    value={editState.coverUrl}
                    onChange={(e) => updateField("coverUrl", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Hero image alt text</span>
                  <input
                    value={editState.heroImageAlt}
                    onChange={(e) => updateField("heroImageAlt", e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Hero video URL</span>
                <input
                  value={editState.heroVideoUrl}
                  onChange={(e) => updateField("heroVideoUrl", e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Stack (comma or newline separated)</span>
                  <textarea
                    value={editState.stackCsv}
                    onChange={(e) => updateField("stackCsv", e.target.value)}
                    rows={3}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Tags (comma or newline separated)</span>
                  <textarea
                    value={editState.tagsCsv}
                    onChange={(e) => updateField("tagsCsv", e.target.value)}
                    rows={3}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Gallery URLs (comma or newline separated)</span>
                <textarea
                  value={editState.galleryCsv}
                  onChange={(e) => updateField("galleryCsv", e.target.value)}
                  rows={2}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Responsibilities (one per line)</span>
                  <textarea
                    value={editState.responsibilitiesText}
                    onChange={(e) => updateField("responsibilitiesText", e.target.value)}
                    rows={4}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-sm sm:text-[15px]">
                  <span className="text-white/70">Outcomes (one per line)</span>
                  <textarea
                    value={editState.outcomesText}
                    onChange={(e) => updateField("outcomesText", e.target.value)}
                    rows={4}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Metrics (format: Label | Value)</span>
                <textarea
                  value={editState.metricsText}
                  onChange={(e) => updateField("metricsText", e.target.value)}
                  rows={3}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </label>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Links (format: Label | URL | Icon)</span>
                <textarea
                  value={editState.linksText}
                  onChange={(e) => updateField("linksText", e.target.value)}
                  rows={3}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </label>

              <label className="grid gap-1 text-sm sm:text-[15px]">
                <span className="text-white/70">Created at (ISO or leave unchanged)</span>
                <input
                  value={editState.createdAt}
                  onChange={(e) => updateField("createdAt", e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  placeholder="2025-01-01T12:00:00Z"
                />
              </label>

              {saveError ? (
                <p className="rounded-xl border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {saveError}
                </p>
              ) : null}

              <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 bg-[#050714]/95 py-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-1.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/80 hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}
