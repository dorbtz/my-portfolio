// supabase/functions/parse-url/index.ts
//
// Edge function that resolves an arbitrary URL into a Partial<FormState>
// suitable for the /admin/projects "Import from URL" UI.
//
// Source detection:
//   1. github.com/{owner}/{repo}    -> GitHub REST API
//   2. *.vercel.app + VERCEL_API_TOKEN env -> Vercel Projects API
//   3. anything else                -> fetch HTML, scrape <head> for OG meta
//
// Errors that are recoverable (rate-limited GitHub, missing OG tags, etc.)
// return 200 with `warnings` populated so the client UI can still proceed.
// Hard transport errors return 502.
//
// CORS preflight is handled inline (no shared module to import).

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  detectUrlSource,
  extractOgMeta,
  isPrivateUrl,
  parseGithubUrl,
} from "./parser.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// All field keys mirror the FormState shape exposed by ProjectsAdmin.tsx.
type FormFieldsPartial = {
  title?: string;
  summary?: string;
  description?: string;
  repoUrl?: string;
  liveUrl?: string;
  coverUrl?: string;
  tagsCsv?: string;
  stackCsv?: string;
};

type Source = "github" | "vercel" | "opengraph";

type ParseUrlBody = {
  source: Source;
  fields: FormFieldsPartial;
  warnings?: string[];
  raw?: Record<string, unknown>;
};

const USER_AGENT_GITHUB = "portfolio-parse-url";
const USER_AGENT_BROWSER = "Mozilla/5.0 (compatible; portfolio-bot)";
const MAX_HTML_BYTES = 256 * 1024; // 256 KB

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function readHeadBytes(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return await response.text();
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let acc = "";
  let received = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      acc += decoder.decode(value, { stream: true });
      if (acc.toLowerCase().includes("</head>") || received >= maxBytes) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
  acc += decoder.decode();
  return acc;
}

// ---------------------------------------------------------------------------
// GitHub branch
// ---------------------------------------------------------------------------
async function parseGithub(url: string): Promise<ParseUrlBody> {
  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return {
      source: "github",
      fields: {},
      warnings: ["Could not parse GitHub URL — expected github.com/{owner}/{repo}."],
    };
  }
  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
  const res = await fetch(apiUrl, {
    headers: {
      "User-Agent": USER_AGENT_GITHUB,
      Accept: "application/vnd.github+json",
    },
  });
  const remaining = res.headers.get("x-ratelimit-remaining");
  const warnings: string[] = [];
  if (remaining === "0") {
    warnings.push("GitHub API rate limit exhausted — try again in an hour.");
  }
  if (!res.ok) {
    return {
      source: "github",
      fields: {},
      warnings: [...warnings, `GitHub API returned ${res.status} ${res.statusText}`],
    };
  }
  const data = (await res.json()) as Record<string, unknown>;
  const fields: FormFieldsPartial = {};
  if (typeof data.name === "string") fields.title = data.name;
  if (typeof data.description === "string" && data.description) {
    fields.summary = data.description;
  }
  if (typeof data.html_url === "string") fields.repoUrl = data.html_url;
  if (typeof data.homepage === "string" && data.homepage.trim()) {
    fields.liveUrl = data.homepage;
  }
  if (Array.isArray(data.topics) && data.topics.length) {
    fields.tagsCsv = (data.topics as string[]).join(", ");
  }

  // Round 36 — fetch the FULL language breakdown via GitHub's
  // /languages endpoint so the stack field captures every language the
  // repo uses (not just the primary). Falls back to `data.language` if
  // the secondary call fails for any reason.
  let stackList: string[] = [];
  try {
    const langRes = await fetch(`${apiUrl}/languages`, {
      headers: {
        "User-Agent": USER_AGENT_GITHUB,
        Accept: "application/vnd.github+json",
      },
    });
    if (langRes.ok) {
      const langData = (await langRes.json()) as Record<string, number>;
      // Sort by byte count desc so the most-used language comes first.
      stackList = Object.entries(langData)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .map(([name]) => name)
        .filter(Boolean);
    } else if (langRes.status !== 404) {
      warnings.push(`GitHub /languages returned ${langRes.status}`);
    }
  } catch (err) {
    warnings.push(`GitHub /languages fetch failed: ${(err as Error).message}`);
  }
  if (!stackList.length && typeof data.language === "string" && data.language) {
    stackList = [data.language];
  }
  if (stackList.length) {
    fields.stackCsv = stackList.join(", ");
  }

  return { source: "github", fields, warnings: warnings.length ? warnings : undefined, raw: data };
}

// ---------------------------------------------------------------------------
// Vercel branch
// ---------------------------------------------------------------------------
async function parseVercel(url: string): Promise<ParseUrlBody> {
  const token = Deno.env.get("VERCEL_API_TOKEN");
  if (!token) {
    // No token — fall through to OG scraping for the same URL.
    return await parseOpenGraph(url, ["VERCEL_API_TOKEN not set — fell back to OpenGraph."]);
  }
  // The project name is the first label of the hostname.
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return { source: "vercel", fields: {}, warnings: ["Invalid Vercel URL."] };
  }
  const projectName = host.split(".")[0];
  if (!projectName) {
    return { source: "vercel", fields: {}, warnings: ["Could not derive Vercel project name."] };
  }
  const res = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return await parseOpenGraph(url, [`Vercel API returned ${res.status} — falling back to OpenGraph.`]);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const fields: FormFieldsPartial = {};
  if (typeof data.name === "string") fields.title = data.name;
  if (typeof data.framework === "string") fields.stackCsv = data.framework;
  fields.liveUrl = url;
  return { source: "vercel", fields, raw: data };
}

// ---------------------------------------------------------------------------
// OpenGraph branch
// ---------------------------------------------------------------------------
async function parseOpenGraph(url: string, prependWarnings: string[] = []): Promise<ParseUrlBody> {
  const warnings = [...prependWarnings];
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT_BROWSER },
    });
  } catch (err) {
    return {
      source: "opengraph",
      fields: {},
      warnings: [...warnings, `Fetch failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
  if (!res.ok) {
    return {
      source: "opengraph",
      fields: {},
      warnings: [...warnings, `Upstream returned ${res.status} ${res.statusText}`],
    };
  }
  const html = await readHeadBytes(res, MAX_HTML_BYTES);
  const og = extractOgMeta(html);
  const fields: FormFieldsPartial = {};
  if (og.title) fields.title = og.title;
  if (og.description) fields.summary = og.description;
  if (og.image) fields.coverUrl = og.image;
  if (og.url) fields.liveUrl = og.url;
  else fields.liveUrl = url;
  if (Object.keys(fields).length === 0) {
    warnings.push("No OpenGraph metadata found.");
  }
  return { source: "opengraph", fields, warnings: warnings.length ? warnings : undefined };
}

// ---------------------------------------------------------------------------
// Top-level handler
// ---------------------------------------------------------------------------
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  let payload: { url?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }
  const rawUrl = payload?.url;
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return jsonResponse(400, { error: "Missing 'url' string in body" });
  }
  if (isPrivateUrl(rawUrl)) {
    return jsonResponse(400, {
      error: "URL points to a private/internal address — refusing to fetch.",
    });
  }

  try {
    const source = detectUrlSource(rawUrl);
    let body: ParseUrlBody;
    if (source === "github") body = await parseGithub(rawUrl);
    else if (source === "vercel") body = await parseVercel(rawUrl);
    else body = await parseOpenGraph(rawUrl);
    return jsonResponse(200, body);
  } catch (err) {
    return jsonResponse(502, {
      error: err instanceof Error ? err.message : "Upstream parse failed",
    });
  }
});

// Make the file a module under tsc strict mode in case anything probes it.
export {};
