/**
 * Pure URL detection + OG meta extraction — Deno edition.
 *
 * THIS IS A DUPLICATE of `src/services/projectUrlImport.parser.ts`. Deno
 * cannot reach into `src/`, so we ship the same ~80 lines twice. If you
 * change one, change the other (and re-run the Vitest suite to verify).
 */

export type DetectedSource = "github" | "vercel" | "opengraph";

export type OgMeta = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
};

const GITHUB_RE = /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+/i;
const VERCEL_RE = /^https?:\/\/[^/]*\.vercel\.app(?:[/?#]|$)/i;

export function detectUrlSource(url: string): DetectedSource {
  const trimmed = url.trim();
  if (GITHUB_RE.test(trimmed)) return "github";
  if (VERCEL_RE.test(trimmed)) return "vercel";
  return "opengraph";
}

const GITHUB_OWNER_REPO_RE =
  /^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?(?:[/?#].*)?$/i;

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = GITHUB_OWNER_REPO_RE.exec(url.trim());
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  if (!owner || !repo) return null;
  const RESERVED = new Set(["settings", "marketplace", "explore", "topics", "trending"]);
  if (RESERVED.has(owner.toLowerCase())) return null;
  return { owner, repo };
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
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

const OG_TAGS = ["og:title", "og:description", "og:image", "og:url"] as const;
const OG_TO_KEY: Record<(typeof OG_TAGS)[number], keyof OgMeta> = {
  "og:title": "title",
  "og:description": "description",
  "og:image": "image",
  "og:url": "url",
};

function buildOgRegexes(tag: string): RegExp[] {
  const t = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    new RegExp(`<meta[^>]+property=["']${t}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${t}["']`, "i"),
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
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 0) return true;
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
    const v6 = host.slice(1, -1);
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
  }
  if (isPrivateIPv4(host)) return true;
  return false;
}
