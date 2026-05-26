/**
 * Pure URL detection + OG meta extraction for the project URL importer.
 *
 * No Deno globals, no React, no Supabase — safe for both Vitest (jsdom) and
 * the duplicated copy under `supabase/functions/parse-url/parser.ts`.
 *
 * If you change anything here, mirror it in the Deno copy. The Deno copy
 * exists because Deno can't import from `src/services/`.
 */

export type DetectedSource = "github" | "vercel" | "opengraph";

export type OgMeta = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
};

// ---------------------------------------------------------------------------
// detectUrlSource — cheap regex routing
// ---------------------------------------------------------------------------
const GITHUB_RE = /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+/i;
const VERCEL_RE = /^https?:\/\/[^/]*\.vercel\.app(?:[/?#]|$)/i;

export function detectUrlSource(url: string): DetectedSource {
  const trimmed = url.trim();
  if (GITHUB_RE.test(trimmed)) return "github";
  if (VERCEL_RE.test(trimmed)) return "vercel";
  return "opengraph";
}

// ---------------------------------------------------------------------------
// parseGithubUrl — extract { owner, repo } tolerating .git, trailing slash,
// query strings, /tree/branch suffixes, etc.
// ---------------------------------------------------------------------------
const GITHUB_OWNER_REPO_RE =
  /^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?(?:[/?#].*)?$/i;

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = GITHUB_OWNER_REPO_RE.exec(url.trim());
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  if (!owner || !repo) return null;
  // Reject reserved GitHub paths that aren't repos.
  const RESERVED = new Set(["settings", "marketplace", "explore", "topics", "trending"]);
  if (RESERVED.has(owner.toLowerCase())) return null;
  return { owner, repo };
}

// ---------------------------------------------------------------------------
// HTML entity decoder — handles named + numeric (decimal & hex) entities
// commonly found in OG tags. Intentionally narrow scope (no full DOM parser).
// ---------------------------------------------------------------------------
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, body: string) => {
    const lower = body.toLowerCase();
    if (lower.startsWith("#x")) {
      const code = parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (lower.startsWith("#")) {
      const code = parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower)) {
      return NAMED_ENTITIES[lower];
    }
    return full;
  });
}

// ---------------------------------------------------------------------------
// extractOgMeta — regex over an HTML <head> snippet. Tolerates both attribute
// orders (property-first OR content-first) and falls back to <title> when no
// og:title is present.
// ---------------------------------------------------------------------------
const OG_TAGS = ["og:title", "og:description", "og:image", "og:url"] as const;
const OG_TO_KEY: Record<(typeof OG_TAGS)[number], keyof OgMeta> = {
  "og:title": "title",
  "og:description": "description",
  "og:image": "image",
  "og:url": "url",
};

function buildOgRegexes(tag: string): RegExp[] {
  // Tag value may use single or double quotes; allow both. The "g" flag is
  // not needed since we only want the first match.
  const t = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    // property="og:title" content="..."
    new RegExp(`<meta[^>]+property=["']${t}["'][^>]*content=["']([^"']*)["']`, "i"),
    // content="..." property="og:title"
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${t}["']`, "i"),
    // Some sites use name="og:title" — uncommon but cheap to support.
    new RegExp(`<meta[^>]+name=["']${t}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${t}["']`, "i"),
  ];
}

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const DESC_FALLBACK_RE =
  /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i;

export function extractOgMeta(html: string): OgMeta {
  const out: OgMeta = {};
  for (const tag of OG_TAGS) {
    const regexes = buildOgRegexes(tag);
    for (const re of regexes) {
      const m = re.exec(html);
      if (m && m[1]) {
        out[OG_TO_KEY[tag]] = decodeHtmlEntities(m[1]).trim();
        break;
      }
    }
  }
  if (!out.title) {
    const tm = TITLE_RE.exec(html);
    if (tm && tm[1]) out.title = decodeHtmlEntities(tm[1]).trim();
  }
  if (!out.description) {
    const dm = DESC_FALLBACK_RE.exec(html);
    if (dm && dm[1]) out.description = decodeHtmlEntities(dm[1]).trim();
  }
  return out;
}

// ---------------------------------------------------------------------------
// isPrivateUrl — SSRF guard. Used both client-side (to short-circuit before
// hitting the edge function) and server-side (defence in depth).
// Rejects:
//   - non-http(s) schemes (file://, data:, javascript:, blob:, ftp://, etc.)
//   - localhost / loopback (127.0.0.0/8, ::1)
//   - RFC1918 (10/8, 192.168/16, 172.16/12)
//   - link-local (169.254/16, fe80::/10)
//   - empty / unparseable URLs
// ---------------------------------------------------------------------------
const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "::",
  "::1",
]);

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

export function isPrivateUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return true;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost")) return true;
  if (host.startsWith("[") && host.endsWith("]")) {
    // IPv6 literal — block loopback and link-local.
    const v6 = host.slice(1, -1);
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
  }
  if (isPrivateIPv4(host)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// FormState shape — duplicated as a structural type so the parser module has
// zero React/Supabase dependencies. The full canonical type lives in
// `src/pages/admin/ProjectsAdmin.tsx`. Keep these in sync if you add fields.
// ---------------------------------------------------------------------------
export type ImportableFormState = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  stackCsv: string;
  tagsCsv: string;
  role: string;
  status: string;
  mode: string;
  priority: number;
  sortOrder: number;
  featured: boolean;
  liveUrl: string;
  repoUrl: string;
  coverUrl: string;
  createdAt: string;
  heroImageAlt: string;
  heroVideoUrl: string;
  gallery: string[];
  linksText: string;
  metricsText: string;
  responsibilitiesText: string;
  outcomesText: string;
};

export type ImportSource = "github" | "vercel" | "opengraph";

// ---------------------------------------------------------------------------
// mergeIntoForm — pure.
//
// Default behaviour: only fills empty fields. Numbers and booleans are
// always preserved (they have defaults the user may have tuned).
//
// Round 36 — `stackCsv` and `tagsCsv` are SPECIAL-CASED: when both
// existing and incoming carry values, we UNION the two CSV lists
// (de-duped, case-insensitive) instead of skipping. This means the user
// can fetch a URL, then keep adding more chips from the dropdown, then
// re-fetch (or fetch a different URL) without losing what they had.
// ---------------------------------------------------------------------------
function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

const CSV_UNION_FIELDS = new Set(["stackCsv", "tagsCsv"]);

function unionCsv(existing: string, incoming: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const key = v.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(v);
  };
  for (const v of existing.split(/[,\n]+/)) add(v);
  for (const v of incoming.split(/[,\n]+/)) add(v);
  return out.join(", ");
}

export function mergeIntoForm<T extends Record<string, unknown>>(
  current: T,
  incoming: Partial<T>,
): T {
  const next: T = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    const existing = (next as Record<string, unknown>)[key];
    // Union CSV lists for stack / tags so URL fetch + manual selections compose.
    if (
      CSV_UNION_FIELDS.has(key) &&
      typeof existing === "string" &&
      typeof value === "string" &&
      existing.trim() !== "" &&
      value.trim() !== ""
    ) {
      (next as Record<string, unknown>)[key] = unionCsv(existing, value);
      continue;
    }
    if (!isEmpty(existing)) continue;
    (next as Record<string, unknown>)[key] = value;
  }
  return next;
}

// ---------------------------------------------------------------------------
// mapToFormState — converts a raw provider payload into a form-shape patch.
// The edge function already maps the common cases, so this is mostly a
// defensive fallback for direct API responses or older deployments.
// ---------------------------------------------------------------------------
export type RawProviderPayload = {
  source?: ImportSource;
  // GitHub shape (subset).
  name?: string;
  full_name?: string;
  description?: string | null;
  html_url?: string;
  homepage?: string | null;
  topics?: string[];
  // OG shape.
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  // Already-mapped FormState fields take priority.
  fields?: Partial<ImportableFormState>;
  warnings?: string[];
};

export function mapToFormState(raw: RawProviderPayload): {
  source: ImportSource;
  fields: Partial<ImportableFormState>;
  warnings?: string[];
} {
  const source: ImportSource = raw.source ?? detectFromShape(raw);
  if (raw.fields) {
    return { source, fields: raw.fields, warnings: raw.warnings };
  }
  const fields: Partial<ImportableFormState> = {};
  if (raw.name) fields.title = raw.name;
  if (raw.description) fields.summary = raw.description;
  if (raw.html_url) fields.repoUrl = raw.html_url;
  if (raw.homepage && raw.homepage.trim()) fields.liveUrl = raw.homepage;
  if (raw.topics && raw.topics.length) fields.tagsCsv = raw.topics.join(", ");
  if (raw.ogTitle && !fields.title) fields.title = raw.ogTitle;
  if (raw.ogDescription && !fields.summary) fields.summary = raw.ogDescription;
  if (raw.ogImage && !fields.coverUrl) fields.coverUrl = raw.ogImage;
  if (raw.ogUrl && !fields.liveUrl) fields.liveUrl = raw.ogUrl;
  return { source, fields, warnings: raw.warnings };
}

function detectFromShape(raw: RawProviderPayload): ImportSource {
  if (raw.html_url || raw.full_name || raw.topics) return "github";
  if (raw.ogTitle || raw.ogImage || raw.ogDescription) return "opengraph";
  return "opengraph";
}
