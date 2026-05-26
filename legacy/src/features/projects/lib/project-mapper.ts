import type { Project, ProjectMode, ProjectStatus } from "../../../types/project";

type ProjectRecord = Record<string, unknown>;

const DEFAULT_STATUS: ProjectStatus = "draft";

/** Coerce an unknown value into `ProjectMode | null`. Anything unrecognised → null. */
function sanitizeMode(value: unknown): ProjectMode | null {
  if (typeof value !== "string") return null;
  const normalised = value.trim().toLowerCase();
  if (normalised === "thor" || normalised === "gear5") return normalised;
  return null;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function sanitizeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function sanitizeNullableString(value: unknown): string | null {
  const sanitized = sanitizeString(value);
  return sanitized ?? null;
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : typeof item === "number" ? String(item) : ""))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toJsonOrNull<T>(value: T[] | null | undefined): T[] | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 0) return [];
  return value;
}

export function mapProjectRow(record: ProjectRecord | Project): Project {
  const nowIso = new Date().toISOString();
  const r = record as Record<string, unknown>;
  const rawId = r?.id ?? r?.slug ?? sanitizeString(r?.title) ?? undefined;
  const slug = sanitizeString(r?.slug) ?? sanitizeString(r?.id) ?? (typeof rawId === "string" ? rawId : "");
  const title = sanitizeString(r?.title) ?? "Untitled project";
  const summary = sanitizeString(r?.summary) ?? sanitizeString(r?.description) ?? "";
  const description = sanitizeString(r?.description) ?? summary;
  const tags = toStringArray(r?.tags);
  const stackCandidates = toStringArray(r?.stack);
  const techCandidates = toStringArray(r?.tech);
  const stack = stackCandidates.length ? stackCandidates : techCandidates;
  const tech = techCandidates.length ? techCandidates : stack;
  const gallery = toStringArray(r?.gallery);
  const responsibilities = toStringArray(r?.responsibilities);
  const outcomes = toStringArray(r?.outcomes);
  const statusValue = sanitizeString(r?.status) as ProjectStatus | undefined;
  const priority = toNumber(r?.priority, 0);
  const sortOrder = r?.sort_order ?? r?.sortOrder ?? r?.priority;

  const ownerProfile = (record as ProjectRecord & { owner_profile?: ProjectRecord; ownerProfile?: ProjectRecord })?.owner_profile
    ?? (record as ProjectRecord & { ownerProfile?: ProjectRecord })?.ownerProfile
    ?? null;
  const ownerUsername = sanitizeString(
    (ownerProfile as ProjectRecord)?.username ?? (record as ProjectRecord)?.owner_username
  );
  const ownerDisplayName = sanitizeString(
    (ownerProfile as ProjectRecord)?.display_name ?? (record as ProjectRecord)?.owner_display_name
  );

  return {
    id: typeof rawId === "string" ? rawId : undefined,
    slug,
    title,
    subtitle: sanitizeString(r?.subtitle) ?? sanitizeString(r?.tagline),
    summary,
    description,
    tags,
    stack,
    tech,
    role: sanitizeString(r?.role),
    status: statusValue && ["draft", "in-progress", "shipped", "archived"].includes(statusValue)
      ? statusValue
      : DEFAULT_STATUS,
    mode: sanitizeMode(r?.mode),
    priority,
    sortOrder: typeof sortOrder === "number" && Number.isFinite(sortOrder)
      ? sortOrder
      : toNumber(sortOrder, priority || 9999),
    featured: Boolean(r?.featured ?? r?.highlight ?? false),
    liveUrl: sanitizeString(r?.live_url) ?? sanitizeString(r?.liveUrl),
    repoUrl: sanitizeString(r?.repo_url) ?? sanitizeString(r?.repoUrl),
    coverUrl: sanitizeString(r?.cover_url) ?? sanitizeString(r?.coverUrl),
    heroImageAlt: sanitizeString(r?.hero_image_alt) ?? sanitizeString(r?.heroImageAlt),
    heroVideoUrl: sanitizeString(r?.hero_video_url) ?? sanitizeString(r?.heroVideoUrl),
    gallery: gallery.length ? gallery : undefined,
    links: Array.isArray(r?.links) ? (r.links as Project["links"]) : undefined,
    metrics: Array.isArray(r?.metrics) ? (r.metrics as Project["metrics"]) : undefined,
    responsibilities: responsibilities.length ? responsibilities : undefined,
    outcomes: outcomes.length ? outcomes : undefined,
    createdAt: sanitizeString(r?.created_at) ?? sanitizeString(r?.createdAt) ?? nowIso,
    updatedAt: sanitizeString(r?.updated_at) ?? sanitizeString(r?.updatedAt),
    owner: typeof r?.owner === "string" ? r.owner : null,
    ownerUsername: ownerUsername ?? null,
    ownerDisplayName: ownerDisplayName ?? null,
    // Round 75: preserve placeholder flag from input.  Real Supabase rows
    // never carry this — only the bundled fixtures.
    placeholder: r?.placeholder === true ? true : undefined,
  };
}

export function mapProjectRows(records: Array<ProjectRecord | Project> | null | undefined): Project[] {
  if (!Array.isArray(records)) return [];
  return records.map(mapProjectRow);
}

function ensureStackArray(project: Partial<Project>): string[] {
  if (Array.isArray(project.stack) && project.stack.length) return project.stack;
  if (Array.isArray(project.tech) && project.tech.length) return project.tech;
  return [];
}

export function projectToInsert(project: Omit<Project, "id"> & { id?: string }): ProjectRecord {
  const nowIso = new Date().toISOString();
  const stack = ensureStackArray(project);
  const tech = Array.isArray(project.tech) && project.tech.length ? project.tech : stack;

  return {
    ...(project.id ? { id: project.id } : {}),
    slug: project.slug,
    title: project.title,
    subtitle: sanitizeNullableString(project.subtitle),
    summary: project.summary,
    description: project.description,
    tags: toStringArray(project.tags),
    stack,
    tech,
    role: sanitizeNullableString(project.role),
    status: project.status ?? DEFAULT_STATUS,
    mode: sanitizeMode(project.mode),
    priority: toNumber(project.priority, 0),
    sort_order: typeof project.sortOrder === "number" ? project.sortOrder : toNumber(project.priority, 0),
    featured: Boolean(project.featured),
    live_url: sanitizeNullableString(project.liveUrl),
    repo_url: sanitizeNullableString(project.repoUrl),
    cover_url: sanitizeNullableString(project.coverUrl),
    hero_image_alt: sanitizeNullableString(project.heroImageAlt),
    hero_video_url: sanitizeNullableString(project.heroVideoUrl),
    gallery: toStringArray(project.gallery),
    links: toJsonOrNull(project.links ?? null),
    metrics: toJsonOrNull(project.metrics ?? null),
    responsibilities: toStringArray(project.responsibilities),
    outcomes: toStringArray(project.outcomes),
    created_at: sanitizeString(project.createdAt) ?? nowIso,
    updated_at: sanitizeString(project.updatedAt) ?? nowIso,
    owner: project.owner ?? null,
  };
}

export function projectToUpdate(patch: Partial<Project>): ProjectRecord {
  const nowIso = new Date().toISOString();
  const row: ProjectRecord = {
    updated_at: sanitizeString(patch.updatedAt) ?? nowIso,
  };

  const assign = <T,>(key: string, value: T, transform?: (value: T) => unknown) => {
    if (value === undefined) return;
    row[key] = transform ? transform(value) : value;
  };

  assign("slug", patch.slug);
  assign("title", patch.title);
  assign("subtitle", patch.subtitle, sanitizeNullableString);
  assign("summary", patch.summary);
  assign("description", patch.description);
  if (patch.tags !== undefined) assign("tags", patch.tags, toStringArray);

  if (patch.stack !== undefined || patch.tech !== undefined) {
    const stack = ensureStackArray(patch);
    const tech = Array.isArray(patch.tech) && patch.tech.length ? patch.tech : stack;
    row.stack = toStringArray(stack);
    row.tech = toStringArray(tech);
  }

  assign("role", patch.role, sanitizeNullableString);
  assign("status", patch.status);
  if (patch.mode !== undefined) row.mode = sanitizeMode(patch.mode);
  if (patch.priority !== undefined) assign("priority", toNumber(patch.priority, 0));
  if (patch.sortOrder !== undefined) assign("sort_order", toNumber(patch.sortOrder, 0));
  if (patch.featured !== undefined) assign("featured", Boolean(patch.featured));
  assign("live_url", patch.liveUrl, sanitizeNullableString);
  assign("repo_url", patch.repoUrl, sanitizeNullableString);
  assign("cover_url", patch.coverUrl, sanitizeNullableString);
  assign("hero_image_alt", patch.heroImageAlt, sanitizeNullableString);
  assign("hero_video_url", patch.heroVideoUrl, sanitizeNullableString);
  if (patch.gallery !== undefined) assign("gallery", patch.gallery, toStringArray);
  if (patch.links !== undefined) assign("links", patch.links, toJsonOrNull);
  if (patch.metrics !== undefined) assign("metrics", patch.metrics, toJsonOrNull);
  if (patch.responsibilities !== undefined) assign("responsibilities", patch.responsibilities, toStringArray);
  if (patch.outcomes !== undefined) assign("outcomes", patch.outcomes, toStringArray);
  assign("created_at", patch.createdAt);
  if (patch.owner !== undefined) assign("owner", patch.owner ?? null);

  return row;
}
