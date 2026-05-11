/**
 * src/pages/projects/ProjectDetail.tsx
 *
 * Dual-mode case-study page rewritten from scratch:
 *
 *  - Thor mode  : MCU comic / cinematic dossier — Asgardian navy + Bifrost blue
 *                 + Mjolnir gold, lightning corner cuts, runic strip, comic
 *                 panels with rivets, glowing status stamp, starfield haze.
 *  - Manga mode : Shonen Jump splash — cream parchment + Ben-Day halftone +
 *                 thick black manga panel borders + brown ink + kana SFX
 *                 (ドン!, ゴムゴム!, バン!), wanted-poster banner, ink-stamp
 *                 status badges, One Piece logo watermark, speech bubble
 *                 pull-quote.
 *
 * All functional behaviour from the previous page is preserved verbatim:
 *   - URL params (`slug` or legacy `id`)
 *   - getProject() fetch + loading + 404 states
 *   - setPageMeta() SEO sync
 *   - View-transition cover (project-cover-${id})
 *   - GitHub badge via useGithubBadge
 *   - Admin edit modal (auth-gated, full Supabase save → updateProject → refetch)
 *   - Quick facts sidebar / stack / supporting tech / tags
 *   - Hero media (video iframe / file / cover image fallback)
 *   - Sections: overview, metrics, responsibilities, outcomes, resources,
 *     gallery, back link
 *
 * Styling lives in src/index.css under the two clearly labelled blocks
 * `ProjectDetail — Thor MCU theme` and `ProjectDetail — Manga theme`.
 */
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject, updateProject } from "../../services/projects";
import type { Project, ProjectLink, ProjectMetric, ProjectStatus } from "../../types/project";
import { setPageMeta } from "../../lib/seo";
import ImageFallback from "../../components/ImageFallback";
import { useGithubBadge } from "../../hooks/useGithubBadge";
import { ProjectActionButton } from "../../components/ProjectActionButton";
import { iconForProjectLink } from "../../components/projectActionHelpers";
import { useAuth } from "../../hooks/useAuth.helpers";
import { useMode } from "../../stores/mode";

// ---------------------------------------------------------------------------
// Formatting / parsing helpers (carried over from the prior implementation)
// ---------------------------------------------------------------------------

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
  return metrics.map((metric) => `${metric.label} | ${metric.value}`).join("\n");
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
      const link: ProjectLink = { label, url, icon: icon || null };
      return link;
    })
    .filter((item): item is ProjectLink => item !== null);
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
  element: ReactElement;
};

// Mode-aware microcopy table — keeps the JSX free of branching strings.
const COPY = {
  thor: {
    back: "← Back to the Archive",
    dossier: "Asgardian Dossier",
    dossierHint: "Field-tested intel from the Nine Realms.",
    overview: "Mission Briefing",
    metrics: "Strike Metrics",
    responsibilities: "Operational Vector",
    outcomes: "Verdict",
    resources: "Bifrost Links",
    gallery: "Holo Reel",
    stack: "Arsenal",
    supporting: "Supporting Runes",
    tags: "Sigils",
    edit: "Edit dossier",
    fallbackMedia: "Hero media is recharging. Picture a Bifrost arrival.",
    fallbackSummary: "No briefing yet. Consider this the calm before the storm.",
    fallbackOverview: "Briefing pending. Heimdall is still composing the report.",
  },
  manga: {
    back: "← Back to the Wanted Wall",
    dossier: "WANTED FILE",
    dossierHint: "Marines say this one is dangerous. Read carefully.",
    overview: "STORY",
    metrics: "POWER STATS",
    responsibilities: "CREW LOG",
    outcomes: "FINAL BELL",
    resources: "BONUS READS",
    gallery: "SPLASH PAGE",
    stack: "DEVIL FRUIT KIT",
    supporting: "Side Tools",
    tags: "Bounty Tags",
    edit: "Edit poster",
    fallbackMedia: "No splash page yet — close your eyes and hear the SFX.",
    fallbackSummary: "No bounty story yet. Picture it: full chapter, big DON!.",
    fallbackOverview: "The story panel is still inked in pencil. Stay tuned.",
  },
} as const;

// ---------------------------------------------------------------------------
// Decorative ambience (aria-hidden, animations gated by prefers-reduced-motion)
// ---------------------------------------------------------------------------

function ThorAmbience() {
  return (
    <div className="project-detail__ambience" aria-hidden="true">
      {/* Lightning bolt corners */}
      <svg
        className="project-detail__bolt project-detail__bolt--tl"
        viewBox="0 0 200 200"
        focusable="false"
      >
        <path
          d="M 80,10 L 110,80 L 80,90 L 130,180 L 100,110 L 130,100 L 80,10 Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="project-detail__bolt project-detail__bolt--tr"
        viewBox="0 0 200 200"
        focusable="false"
      >
        <path
          d="M 80,10 L 110,80 L 80,90 L 130,180 L 100,110 L 130,100 L 80,10 Z"
          fill="currentColor"
        />
      </svg>
      {/* Asgardian rune strip across the bottom of the hero band */}
      <span className="project-detail__rune-strip">
        ᚦᛟᚱ ᛬ ᚨᛋᚷᚨᚱᛞ ᛬ ᛗᛃᛟᛚᚾᛁᚱ ᛬ ᛒᛁᚠᚱᛟᛋᛏ ᛬ ᚺᛖᛁᛗᛞᚨᛚᛚ
      </span>
      {/* Marvel / Avengers wordmark watermark (May 2026 asset refresh) */}
      <picture className="project-detail__watermark project-detail__watermark--thor">
        <img src="/assets/Marvel/avengers-logo.png" alt="" loading="lazy" />
      </picture>
      {/* Star-field haze */}
      <span className="project-detail__starfield" />
    </div>
  );
}

function MangaAmbience() {
  return (
    <div className="project-detail__ambience" aria-hidden="true">
      <span className="project-detail__sfx project-detail__sfx--top-left">ドン!</span>
      <span className="project-detail__sfx project-detail__sfx--top-right">バン!</span>
      <span className="project-detail__sfx project-detail__sfx--bottom-left">ゴムゴム!</span>
      <span className="project-detail__speed-lines" />
      <picture className="project-detail__watermark project-detail__watermark--manga">
        <source srcSet="/assets/One-Piece/One-Piece-Logo-1416.webp" type="image/webp" />
        <img src="/assets/One-Piece/One-Piece-Logo-1416.png" alt="" loading="lazy" />
      </picture>
      <picture className="project-detail__watermark project-detail__watermark--fruit">
        <source srcSet="/assets/One-Piece/Gomu-Gomu-no-Mi-One-Piece-Devil-Fruit-415.webp" type="image/webp" />
        <img src="/assets/One-Piece/Gomu-Gomu-no-Mi-One-Piece-Devil-Fruit-415.png" alt="" loading="lazy" />
      </picture>
    </div>
  );
}

// Inline status "stamp" — different fill per mode but identical structure.
function StatusStamp({ label, isThor }: { label: string; isThor: boolean }) {
  return (
    <span
      className={`project-detail__stamp ${isThor ? "project-detail__stamp--thor" : "project-detail__stamp--manga"}`}
      role="img"
      aria-label={`Status: ${label}`}
    >
      <span className="project-detail__stamp-text">{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProjectDetail() {
  const { id: legacyId, slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { count: ghCount, label: ghLabel } = useGithubBadge(project?.repoUrl);
  const { user } = useAuth();
  const mode = useMode();
  const isThor = mode === "thor";
  const copy = isThor ? COPY.thor : COPY.manga;
  const canEdit = Boolean(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<ProjectEditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // saveSuccess no longer rendered (Round 36+1) — kept setter for the
  // editor save flow which still writes to it for now.
  const [, setSaveSuccess] = useState<string | null>(null);

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

  // openEditor removed in Round 36+1 — the inline editor on this page is
  // no longer reachable. Project edits go through /admin/projects.
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

  // ---------- loading / 404 states ----------

  if (loading) {
    return (
      <div
        className={[
          "project-detail-status py-16 text-sm",
          isThor ? "project-detail-status--thor" : "project-detail-status--manga",
        ].join(" ")}
      >
        {isThor ? "Summoning the dossier..." : "Inking the next chapter..."}
      </div>
    );
  }

  if (!project) {
    return (
      <div
        className={[
          "project-detail-status py-16",
          isThor ? "project-detail-status--thor" : "project-detail-status--manga",
        ].join(" ")}
      >
        <h1 className="text-2xl font-semibold">
          {isThor ? "Dossier missing from the Vault" : "Page torn from the chapter"}
        </h1>
        <p className="mt-3 text-sm opacity-80">
          {isThor
            ? "Heimdall cannot see this case study. It may not exist or be sealed."
            : "This wanted poster was either never printed or the marines burned it."}
        </p>
        <Link to="/#projects" className="project-detail-status__back mt-6 inline-flex items-center gap-2">
          {copy.back}
        </Link>
      </div>
    );
  }

  // ---------- normalised data ----------

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
  const summaryDisplay = heroSummary || copy.fallbackSummary;
  const overviewCopy = project.description?.trim();
  const overviewDisplay = overviewCopy || copy.fallbackOverview;

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

  // ---------- hero media (video first, cover second) ----------

  const heroMedia: HeroMediaItem[] = [];
  if (heroVideo) {
    const isFile = /\.(mp4|mov)(\?.*)?$/i.test(heroVideo);
    heroMedia.push({
      key: "hero-video",
      element: (
        <div className="project-detail__media-frame">
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
        // viewTransitionName matches the card's photo wrapper so the cover
        // morphs smoothly when navigating from the project grid (View Transitions API).
        <div
          className="project-detail__media-frame"
          style={
            project.id
              ? ({ viewTransitionName: `project-cover-${project.id}` } as CSSProperties)
              : undefined
          }
        >
          <ImageFallback
            src={heroCover}
            alt={project.heroImageAlt || `${title} cover`}
            rounded="rounded-none"
            aspect="golden"
            className="h-full w-full"
          />
        </div>
      ),
    });
  }

  const primaryMedia = heroMedia[0];
  const secondaryMedia = heroMedia.slice(1);

  // ---------- render ----------

  // Width / padding now match the home page's `.wrap` token (--page-max +
  // clamp padding) so Project Detail is centered identically across breakpoints
  // instead of using a smaller max-w-6xl that visually drifted left on wide
  // viewports. The actual sizing rule lives in .project-detail (index.css).
  const rootClass = [
    "project-detail relative pb-16 pt-14 lg:pb-20 lg:pt-16",
    isThor ? "project-detail--thor" : "project-detail--manga",
  ].join(" ");

  return (
    <article className={rootClass} data-mode-target={mode}>
      {isThor ? <ThorAmbience /> : <MangaAmbience />}

      {/* ---------- top bar: back link + timestamp chip ---------- */}
      <div className="project-detail__topbar">
        <Link to="/#projects" className="project-detail__back">
          <span>{copy.back}</span>
        </Link>
        {wasUpdated && updatedDisplay ? (
          <span className="project-detail__chip">Updated {updatedDisplay}</span>
        ) : !wasUpdated && createdDisplay ? (
          <span className="project-detail__chip">Created {createdDisplay}</span>
        ) : null}
      </div>

      {/* ---------- HERO ---------- */}
      <header className="project-detail__hero">
        <div className="project-detail__hero-text project-detail__panel project-detail__panel--hero">
          {/* corner rivets / ink corners decorations live in CSS via ::before/::after */}
          <div className="project-detail__hero-meta">
            <StatusStamp label={statusLabel} isThor={isThor} />
            <span className="project-detail__chip project-detail__chip--ghost">
              {isThor ? `Priority ${project.priority ?? 0}` : `Bounty Lv.${project.priority ?? 0}`}
            </span>
            {project.featured ? (
              <span className="project-detail__chip project-detail__chip--featured">
                {isThor ? "Featured Saga" : "Cover Story"}
              </span>
            ) : null}
          </div>

          {/* "Wanted" / Dossier banner above the title sets the universe */}
          <div
            className={
              isThor
                ? "project-detail__banner project-detail__banner--thor"
                : "project-detail__banner project-detail__banner--manga"
            }
          >
            {isThor ? "// CASE FILE" : "WANTED — DEAD OR ALIVE"}
          </div>

          <h1 className="project-detail__title">{title}</h1>
          {project.subtitle ? (
            <p className="project-detail__subtitle">{project.subtitle}</p>
          ) : null}

          {/* Manga: speech-bubble pull quote. Thor: cinematic blockquote. */}
          {isThor ? (
            <p className="project-detail__hero-summary">{summaryDisplay}</p>
          ) : (
            <div className="project-detail__bubble" role="presentation">
              <p>{summaryDisplay}</p>
            </div>
          )}

          <div className="project-detail__cta-row">
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

          {/* Round 36+1 — Edit dossier / Edit poster button removed from
              the public project page. Project edits go through
              /admin/projects only. */}
        </div>

        <div className="project-detail__hero-media">
          {primaryMedia ? (
            <div key={primaryMedia.key} className="project-detail__media-card">
              {primaryMedia.element}
              {/* manga panel page-corner SFX, hidden in thor via CSS */}
              <span className="project-detail__media-corner" aria-hidden="true">
                {isThor ? "TRANSMISSION" : "ドン!"}
              </span>
            </div>
          ) : (
            <div className="project-detail__media-empty">{copy.fallbackMedia}</div>
          )}
          {secondaryMedia.length ? (
            <div className="project-detail__media-grid">
              {secondaryMedia.map((media) => (
                <div key={media.key} className="project-detail__media-card project-detail__media-card--small">
                  {media.element}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {/* ---------- BODY: 2-column ---------- */}
      <section className="project-detail__body">
        <div className="project-detail__main">
          {/* Overview */}
          <div className="project-detail__panel project-detail__panel--story">
            <SectionHeader title={copy.overview} kind="overview" isThor={isThor} />
            <p className="project-detail__overview">{overviewDisplay}</p>
          </div>

          {/* Metrics */}
          {metrics.length ? (
            <div className="project-detail__panel project-detail__panel--metrics">
              <SectionHeader title={copy.metrics} kind="metrics" isThor={isThor} />
              <ul className="project-detail__metric-grid">
                {metrics.map((metric, idx) => (
                  <li key={metric.label} className="project-detail__metric-tile" style={{ "--i": idx } as CSSProperties}>
                    <div className="project-detail__metric-label">{metric.label}</div>
                    <div className="project-detail__metric-value">{metric.value}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Responsibilities (numbered like comic panels) */}
          {responsibilities.length ? (
            <div className="project-detail__panel project-detail__panel--list">
              <SectionHeader title={copy.responsibilities} kind="ops" isThor={isThor} />
              <ol className="project-detail__numbered-list">
                {responsibilities.map((item, idx) => (
                  <li key={item} className="project-detail__numbered-item">
                    <span className="project-detail__numbered-num">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="project-detail__numbered-text">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* Outcomes (stamp-style tiles) */}
          {outcomes.length ? (
            <div className="project-detail__panel project-detail__panel--outcomes">
              <SectionHeader title={copy.outcomes} kind="verdict" isThor={isThor} />
              <ul className="project-detail__outcome-list">
                {outcomes.map((item) => (
                  <li key={item} className="project-detail__outcome-tile">
                    <span className="project-detail__outcome-bullet" aria-hidden="true">
                      {isThor ? "⚡" : "★"}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Resource links */}
          {resourceLinks.length ? (
            <div className="project-detail__panel project-detail__panel--resources">
              <SectionHeader title={copy.resources} kind="links" isThor={isThor} />
              <p className="project-detail__panel-hint">
                {isThor
                  ? "Comm channels for the curious."
                  : "Extra reads pinned to the wall by the cabin boy."}
              </p>
              <div className="project-detail__resource-row">
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

          {/* Gallery */}
          {galleryItems.length ? (
            <div className="project-detail__panel project-detail__panel--gallery">
              <div className="project-detail__panel-row">
                <SectionHeader title={copy.gallery} kind="gallery" isThor={isThor} />
                <span className="project-detail__chip project-detail__chip--ghost">
                  {galleryItems.length} {galleryItems.length === 1 ? "frame" : "frames"}
                </span>
              </div>
              <div className="project-detail__gallery-grid">
                {galleryItems.map((item, idx) => (
                  <div
                    key={item}
                    className="project-detail__gallery-cell"
                    style={{ "--i": idx } as CSSProperties}
                  >
                    <ImageFallback
                      src={item}
                      alt={`${title} gallery item`}
                      rounded="rounded-none"
                      aspect="square"
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <aside className="project-detail__aside">
          <div className="project-detail__panel project-detail__panel--dossier">
            <SectionHeader title={copy.dossier} kind="dossier" isThor={isThor} compact />
            <p className="project-detail__panel-hint">{copy.dossierHint}</p>
            <dl className="project-detail__dl">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="project-detail__dl-row">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
            {ghCount !== null && ghLabel ? (
              <div className="project-detail__gh-badge">
                {ghLabel}: <span>{ghCount}</span>
              </div>
            ) : null}
          </div>

          <div className="project-detail__panel project-detail__panel--stack">
            <SectionHeader title={copy.stack} kind="stack" isThor={isThor} compact />
            {stack.length ? (
              <ul className="project-detail__chip-list">
                {stack.map((item) => (
                  <li key={item} className="project-detail__rune-chip">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="project-detail__panel-hint">
                {isThor ? "No arsenal logged. Maybe a hammer." : "No fruit kit listed yet."}
              </p>
            )}
            {extraTech.length ? (
              <div className="project-detail__sub-stack">
                <div className="project-detail__sub-stack-title">{copy.supporting}</div>
                <ul className="project-detail__chip-list project-detail__chip-list--small">
                  {extraTech.map((item) => (
                    <li key={item} className="project-detail__rune-chip project-detail__rune-chip--small">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="project-detail__panel project-detail__panel--tags">
            <SectionHeader title={copy.tags} kind="tags" isThor={isThor} compact />
            {project.tags?.length ? (
              <ul className="project-detail__chip-list project-detail__chip-list--small">
                {project.tags.map((tag) => (
                  <li key={tag} className="project-detail__rune-chip project-detail__rune-chip--small">
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="project-detail__panel-hint">
                {isThor ? "No sigils marked." : "No bounty tags yet — be the first."}
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* ---------- ADMIN EDIT MODAL (shared, themed shell only) ---------- */}
      {canEdit && isEditing && editState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close editor"
            onClick={closeEditor}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            className={[
              "relative z-[91] w-full max-w-4xl rounded-[28px] p-6 text-left shadow-[0_40px_160px_rgba(0,0,0,0.45)] sm:p-8",
              isThor
                ? "border border-white/15 bg-[#050714]/95 text-white"
                : "border-4 border-[#1a0d05] bg-[#fffaef] text-[#1a0d05]",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={isThor ? "text-xl font-semibold text-white" : "text-xl font-semibold text-[#1a0d05]"}>
                  Edit project
                </h2>
                <p className={isThor ? "mt-1 text-sm text-white/60" : "mt-1 text-sm text-[#5c3414]"}>
                  Update the case study content, then save to sync with Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className={[
                  "rounded-full px-3 py-1 text-sm transition",
                  isThor
                    ? "border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                    : "border-2 border-[#1a0d05] text-[#1a0d05] hover:bg-[#1a0d05] hover:text-[#fffaef]",
                ].join(" ")}
                aria-label="Close editor"
              >
                ×
              </button>
            </div>

            <form
              className={[
                "mt-5 grid max-h-[70vh] gap-5 overflow-y-auto pr-1 text-sm sm:text-base",
                isThor ? "text-white/85" : "text-[#1a0d05]",
              ].join(" ")}
              onSubmit={handleSave}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Title" isThor={isThor}>
                  <input
                    value={editState.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className={modalInputClass(isThor)}
                    required
                  />
                </ModalLabel>
                <ModalLabel label="Subtitle" isThor={isThor}>
                  <input
                    value={editState.subtitle}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <ModalLabel label="Summary" isThor={isThor}>
                <textarea
                  value={editState.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  rows={3}
                  className={modalInputClass(isThor)}
                  required
                />
              </ModalLabel>

              <ModalLabel label="Overview copy" isThor={isThor}>
                <textarea
                  value={editState.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  className={modalInputClass(isThor)}
                />
              </ModalLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Status" isThor={isThor}>
                  <select
                    value={editState.status}
                    onChange={(e) => updateField("status", e.target.value as ProjectStatus)}
                    className={modalInputClass(isThor)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </ModalLabel>
                <ModalLabel label="Priority" isThor={isThor}>
                  <input
                    type="number"
                    value={editState.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className={isThor ? "inline-flex items-center gap-2 text-sm text-white/75" : "inline-flex items-center gap-2 text-sm text-[#4a2a0a]"}>
                  <input
                    type="checkbox"
                    checked={editState.featured}
                    onChange={(e) => updateField("featured", e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/5 accent-cyan-300/80"
                  />
                  Featured project
                </label>
                <ModalLabel label="Role" isThor={isThor}>
                  <input
                    value={editState.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Live URL" isThor={isThor}>
                  <input
                    value={editState.liveUrl}
                    onChange={(e) => updateField("liveUrl", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
                <ModalLabel label="Repo URL" isThor={isThor}>
                  <input
                    value={editState.repoUrl}
                    onChange={(e) => updateField("repoUrl", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Cover image URL" isThor={isThor}>
                  <input
                    value={editState.coverUrl}
                    onChange={(e) => updateField("coverUrl", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
                <ModalLabel label="Hero image alt text" isThor={isThor}>
                  <input
                    value={editState.heroImageAlt}
                    onChange={(e) => updateField("heroImageAlt", e.target.value)}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <ModalLabel label="Hero video URL" isThor={isThor}>
                <input
                  value={editState.heroVideoUrl}
                  onChange={(e) => updateField("heroVideoUrl", e.target.value)}
                  className={modalInputClass(isThor)}
                />
              </ModalLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Stack (comma or newline separated)" isThor={isThor}>
                  <textarea
                    value={editState.stackCsv}
                    onChange={(e) => updateField("stackCsv", e.target.value)}
                    rows={3}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
                <ModalLabel label="Tags (comma or newline separated)" isThor={isThor}>
                  <textarea
                    value={editState.tagsCsv}
                    onChange={(e) => updateField("tagsCsv", e.target.value)}
                    rows={3}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <ModalLabel label="Gallery URLs (comma or newline separated)" isThor={isThor}>
                <textarea
                  value={editState.galleryCsv}
                  onChange={(e) => updateField("galleryCsv", e.target.value)}
                  rows={2}
                  className={modalInputClass(isThor)}
                />
              </ModalLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalLabel label="Responsibilities (one per line)" isThor={isThor}>
                  <textarea
                    value={editState.responsibilitiesText}
                    onChange={(e) => updateField("responsibilitiesText", e.target.value)}
                    rows={4}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
                <ModalLabel label="Outcomes (one per line)" isThor={isThor}>
                  <textarea
                    value={editState.outcomesText}
                    onChange={(e) => updateField("outcomesText", e.target.value)}
                    rows={4}
                    className={modalInputClass(isThor)}
                  />
                </ModalLabel>
              </div>

              <ModalLabel label="Metrics (format: Label | Value)" isThor={isThor}>
                <textarea
                  value={editState.metricsText}
                  onChange={(e) => updateField("metricsText", e.target.value)}
                  rows={3}
                  className={modalInputClass(isThor)}
                />
              </ModalLabel>

              <ModalLabel label="Links (format: Label | URL | Icon)" isThor={isThor}>
                <textarea
                  value={editState.linksText}
                  onChange={(e) => updateField("linksText", e.target.value)}
                  rows={3}
                  className={modalInputClass(isThor)}
                />
              </ModalLabel>

              <ModalLabel label="Created at (ISO or leave unchanged)" isThor={isThor}>
                <input
                  value={editState.createdAt}
                  onChange={(e) => updateField("createdAt", e.target.value)}
                  className={modalInputClass(isThor)}
                  placeholder="2025-01-01T12:00:00Z"
                />
              </ModalLabel>

              {saveError ? (
                <p
                  className={
                    isThor
                      ? "rounded-xl border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"
                      : "rounded-xl border-2 border-[#a1180a] bg-[#fff0e6] px-3 py-2 text-sm text-[#a1180a]"
                  }
                >
                  {saveError}
                </p>
              ) : null}

              <div
                className={[
                  "sticky bottom-0 flex flex-wrap justify-end gap-2 py-2",
                  isThor ? "bg-[#050714]/95" : "bg-[#fffaef]/95",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={closeEditor}
                  className={
                    isThor
                      ? "inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                      : "inline-flex items-center gap-2 rounded-full border-2 border-[#1a0d05] px-3 py-1.5 text-sm text-[#1a0d05] transition hover:bg-[#1a0d05] hover:text-[#fffaef]"
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={
                    isThor
                      ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-1.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/80 hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                      : "inline-flex items-center gap-2 rounded-full border-2 border-[#1a0d05] bg-[#d11b1b] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#fffaef] transition hover:bg-[#1a0d05] disabled:cursor-not-allowed disabled:opacity-60"
                  }
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

// ---------------------------------------------------------------------------
// Small render helpers
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  kind,
  isThor,
  compact = false,
}: {
  title: string;
  kind: "overview" | "metrics" | "ops" | "verdict" | "links" | "gallery" | "dossier" | "stack" | "tags";
  isThor: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "project-detail__section-header",
        compact ? "project-detail__section-header--compact" : "",
        `project-detail__section-header--${kind}`,
      ].join(" ").trim()}
    >
      {/* The decorative glyph on the left switches per mode + section kind via CSS. */}
      <span className="project-detail__section-glyph" aria-hidden="true" />
      <h2 className="project-detail__section-title">{title}</h2>
      {isThor ? (
        <span className="project-detail__section-flair" aria-hidden="true" />
      ) : null}
    </div>
  );
}

function ModalLabel({
  label,
  isThor,
  children,
}: {
  label: string;
  isThor: boolean;
  children: ReactElement;
}) {
  return (
    <label className="grid gap-1 text-sm sm:text-[15px]">
      <span className={isThor ? "text-white/70" : "text-[#4a2a0a]"}>{label}</span>
      {children}
    </label>
  );
}

function modalInputClass(isThor: boolean): string {
  return isThor
    ? "rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
    : "rounded-md border-2 border-[#1a0d05] bg-[#fffaef] px-3 py-2 text-sm text-[#1a0d05] focus:border-[#d11b1b] focus:outline-none";
}
