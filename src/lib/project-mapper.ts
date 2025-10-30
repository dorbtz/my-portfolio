import type { Project, ProjectStatus } from "../types/project";

type Primitive = string | number | boolean | null | undefined;
type ProjectRecord = Record<string, unknown>;

const DEFAULT_STATUS: ProjectStatus = "draft";

function toNumber(value: Primitive, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function sanitizeString(value: Primitive): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function sanitizeNullableString(value: Primitive): string | null {
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
  const rawId = record?.id ?? record?.slug ?? sanitizeString(record?.title) ?? undefined;
  const slug = sanitizeString(record?.slug) ?? sanitizeString(record?.id) ?? (typeof rawId === "string" ? rawId : "");
  const title = sanitizeString(record?.title) ?? "Untitled project";
  const summary = sanitizeString(record?.summary) ?? sanitizeString(record?.description) ?? "";
  const description = sanitizeString(record?.description) ?? summary;
  const tags = toStringArray(record?.tags);
  const stackCandidates = toStringArray(record?.stack);
  const techCandidates = toStringArray(record?.tech);
  const stack = stackCandidates.length ? stackCandidates : techCandidates;
  const tech = techCandidates.length ? techCandidates : stack;
  const gallery = toStringArray(record?.gallery);
  const responsibilities = toStringArray(record?.responsibilities);
  const outcomes = toStringArray(record?.outcomes);
  const statusValue = sanitizeString(record?.status) as ProjectStatus | undefined;
  const priority = toNumber(record?.priority, 0);
  const sortOrder = record?.sort_order ?? record?.sortOrder ?? record?.priority;

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
    subtitle: sanitizeString(record?.subtitle) ?? sanitizeString(record?.tagline),
    summary,
    description,
    tags,
    stack,
    tech,
    role: sanitizeString(record?.role),
    status: statusValue && ["draft", "in-progress", "shipped", "archived"].includes(statusValue)
      ? statusValue
      : DEFAULT_STATUS,
    priority,
    sortOrder: typeof sortOrder === "number" && Number.isFinite(sortOrder)
      ? sortOrder
      : toNumber(sortOrder, priority || 9999),
    featured: Boolean(record?.featured ?? record?.highlight ?? false),
    liveUrl: sanitizeString(record?.live_url) ?? sanitizeString(record?.liveUrl),
    repoUrl: sanitizeString(record?.repo_url) ?? sanitizeString(record?.repoUrl),
    coverUrl: sanitizeString(record?.cover_url) ?? sanitizeString(record?.coverUrl),
    heroImageAlt: sanitizeString(record?.hero_image_alt) ?? sanitizeString(record?.heroImageAlt),
    heroVideoUrl: sanitizeString(record?.hero_video_url) ?? sanitizeString(record?.heroVideoUrl),
    gallery: gallery.length ? gallery : undefined,
    links: Array.isArray(record?.links) ? record.links : undefined,
    metrics: Array.isArray(record?.metrics) ? record.metrics : undefined,
    responsibilities: responsibilities.length ? responsibilities : undefined,
    outcomes: outcomes.length ? outcomes : undefined,
    createdAt: sanitizeString(record?.created_at) ?? sanitizeString(record?.createdAt) ?? nowIso,
    updatedAt: sanitizeString(record?.updated_at) ?? sanitizeString(record?.updatedAt),
    owner: typeof record?.owner === "string" ? record.owner : record?.owner ?? null,
    ownerUsername: ownerUsername ?? null,
    ownerDisplayName: ownerDisplayName ?? null,
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

  const assign = (key: string, value: unknown, transform?: (value: unknown) => unknown) => {
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
