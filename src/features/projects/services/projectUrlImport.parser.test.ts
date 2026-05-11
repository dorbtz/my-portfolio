/**
 * src/services/projectUrlImport.parser.test.ts
 *
 * Pure-function coverage for the URL parser used by /admin/projects URL
 * importer. Inlines the parser implementation because the rolldown-vite
 * vmThreads pool can't reliably transform module exports through SSR
 * (same constraint as `src/lib/projectDefaultCover.test.ts` and
 * `src/lib/easterEggs.test.ts`). The inlined functions MUST stay in
 * lockstep with `src/services/projectUrlImport.parser.ts`.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Inlined implementation — mirror of src/services/projectUrlImport.parser.ts
// ---------------------------------------------------------------------------
type DetectedSource = "github" | "vercel" | "opengraph";
type OgMeta = { title?: string; description?: string; image?: string; url?: string };

const GITHUB_RE = /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+/i;
const VERCEL_RE = /^https?:\/\/[^/]*\.vercel\.app(?:[/?#]|$)/i;

function detectUrlSource(url: string): DetectedSource {
  const trimmed = url.trim();
  if (GITHUB_RE.test(trimmed)) return "github";
  if (VERCEL_RE.test(trimmed)) return "vercel";
  return "opengraph";
}

const GITHUB_OWNER_REPO_RE =
  /^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?(?:[/?#].*)?$/i;

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
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
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'",
};

function decodeHtmlEntities(input: string): string {
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
    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower)) return NAMED_ENTITIES[lower];
    return full;
  });
}

const OG_TAGS = ["og:title", "og:description", "og:image", "og:url"] as const;
const OG_TO_KEY: Record<(typeof OG_TAGS)[number], keyof OgMeta> = {
  "og:title": "title", "og:description": "description", "og:image": "image", "og:url": "url",
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
const DESC_FALLBACK_RE = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i;

function extractOgMeta(html: string): OgMeta {
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

const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::", "::1"]);
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
function isPrivateUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  let parsed: URL;
  try { parsed = new URL(trimmed); } catch { return true; }
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("detectUrlSource", () => {
  it("classifies github.com URLs as 'github'", () => {
    expect(detectUrlSource("https://github.com/torvalds/linux")).toBe("github");
    expect(detectUrlSource("http://www.github.com/foo/bar")).toBe("github");
  });
  it("classifies *.vercel.app URLs as 'vercel'", () => {
    expect(detectUrlSource("https://my-site.vercel.app")).toBe("vercel");
    expect(detectUrlSource("https://my-site.vercel.app/some/path")).toBe("vercel");
  });
  it("classifies everything else as 'opengraph'", () => {
    expect(detectUrlSource("https://example.com")).toBe("opengraph");
    expect(detectUrlSource("https://my-blog.dev/posts/1")).toBe("opengraph");
  });
});

describe("parseGithubUrl", () => {
  it("returns owner+repo for a clean URL", () => {
    expect(parseGithubUrl("https://github.com/torvalds/linux")).toEqual({ owner: "torvalds", repo: "linux" });
  });
  it("strips the .git suffix", () => {
    expect(parseGithubUrl("https://github.com/foo/bar.git")).toEqual({ owner: "foo", repo: "bar" });
  });
  it("ignores trailing slashes and /tree/branch suffixes", () => {
    expect(parseGithubUrl("https://github.com/foo/bar/")).toEqual({ owner: "foo", repo: "bar" });
    expect(parseGithubUrl("https://github.com/foo/bar/tree/main")).toEqual({ owner: "foo", repo: "bar" });
  });
  it("handles weird repo characters (dots, underscores, hyphens)", () => {
    expect(parseGithubUrl("https://github.com/dor.btz/my_repo-2024")).toEqual({ owner: "dor.btz", repo: "my_repo-2024" });
  });
  it("rejects reserved owner paths", () => {
    expect(parseGithubUrl("https://github.com/marketplace/category/x")).toBeNull();
    expect(parseGithubUrl("https://github.com/settings/profile")).toBeNull();
  });
  it("returns null for non-github URLs", () => {
    expect(parseGithubUrl("https://gitlab.com/foo/bar")).toBeNull();
    expect(parseGithubUrl("not a url")).toBeNull();
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(decodeHtmlEntities("&lt;script&gt;")).toBe("<script>");
    expect(decodeHtmlEntities('a &quot;b&quot; c')).toBe('a "b" c');
  });
  it("decodes numeric and hex entities", () => {
    expect(decodeHtmlEntities("&#39;")).toBe("'");
    expect(decodeHtmlEntities("&#x27;")).toBe("'");
    expect(decodeHtmlEntities("caf&#233;")).toBe("café");
  });
  it("leaves unknown entities untouched", () => {
    expect(decodeHtmlEntities("&zzz;")).toBe("&zzz;");
  });
});

describe("extractOgMeta", () => {
  it("extracts the standard property-first attribute order", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Hello" />
        <meta property="og:description" content="World" />
        <meta property="og:image" content="https://x/y.png" />
        <meta property="og:url" content="https://x/" />
      </head></html>`;
    expect(extractOgMeta(html)).toEqual({
      title: "Hello", description: "World", image: "https://x/y.png", url: "https://x/",
    });
  });
  it("extracts the reversed content-first attribute order", () => {
    expect(extractOgMeta(`<meta content="Reversed Title" property="og:title">`).title).toBe("Reversed Title");
  });
  it("decodes HTML entities in OG values", () => {
    expect(extractOgMeta(`<meta property="og:title" content="Tom &amp; Jerry &#39;s show">`).title)
      .toBe("Tom & Jerry 's show");
  });
  it("falls back to <title> when og:title is missing", () => {
    expect(extractOgMeta(`<html><head><title>Plain Title</title></head></html>`).title).toBe("Plain Title");
  });
  it("falls back to meta name=description when og:description is missing", () => {
    expect(extractOgMeta(`<meta name="description" content="A plain meta description">`).description)
      .toBe("A plain meta description");
  });
  it("returns an empty object when no metadata is present", () => {
    expect(extractOgMeta("<html><body>nothing</body></html>")).toEqual({});
  });
  it("supports name='og:image' (uncommon but observed)", () => {
    expect(extractOgMeta(`<meta name="og:image" content="https://x/cover.jpg">`).image).toBe("https://x/cover.jpg");
  });
  it("uses single-quoted attributes correctly", () => {
    expect(extractOgMeta(`<meta property='og:title' content='Single-Quoted'>`).title).toBe("Single-Quoted");
  });
});

describe("isPrivateUrl (SSRF guard)", () => {
  it("rejects non-http(s) schemes", () => {
    expect(isPrivateUrl("file:///etc/passwd")).toBe(true);
    expect(isPrivateUrl("data:text/html,<h1>hi</h1>")).toBe(true);
    expect(isPrivateUrl("javascript:alert(1)")).toBe(true);
    expect(isPrivateUrl("ftp://foo.com")).toBe(true);
  });
  it("rejects loopback hostnames", () => {
    expect(isPrivateUrl("http://localhost")).toBe(true);
    expect(isPrivateUrl("http://localhost:8080")).toBe(true);
    expect(isPrivateUrl("http://api.localhost")).toBe(true);
    expect(isPrivateUrl("http://127.0.0.1")).toBe(true);
    expect(isPrivateUrl("http://127.99.99.99")).toBe(true);
  });
  it("rejects RFC1918 / link-local IPv4", () => {
    expect(isPrivateUrl("http://10.0.0.1")).toBe(true);
    expect(isPrivateUrl("http://10.255.255.255")).toBe(true);
    expect(isPrivateUrl("http://192.168.1.1")).toBe(true);
    expect(isPrivateUrl("http://172.16.0.1")).toBe(true);
    expect(isPrivateUrl("http://172.31.255.255")).toBe(true);
    expect(isPrivateUrl("http://169.254.169.254")).toBe(true);
  });
  it("rejects IPv6 loopback / unspecified", () => {
    expect(isPrivateUrl("http://[::1]")).toBe(true);
    expect(isPrivateUrl("http://[::]")).toBe(true);
  });
  it("rejects empty / unparseable input", () => {
    expect(isPrivateUrl("")).toBe(true);
    expect(isPrivateUrl("   ")).toBe(true);
    expect(isPrivateUrl("not a url at all")).toBe(true);
  });
  it("accepts public URLs", () => {
    expect(isPrivateUrl("https://github.com/foo/bar")).toBe(false);
    expect(isPrivateUrl("https://my-app.vercel.app")).toBe(false);
    expect(isPrivateUrl("https://example.com")).toBe(false);
    expect(isPrivateUrl("http://1.1.1.1")).toBe(false);
    expect(isPrivateUrl("http://172.32.0.1")).toBe(false);
  });
  it("rejects 0.0.0.0 (any-IP / reserved)", () => {
    expect(isPrivateUrl("http://0.0.0.0")).toBe(true);
    expect(isPrivateUrl("http://0.1.2.3")).toBe(true);
  });
});
