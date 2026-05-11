/**
 * src/services/projectUrlImport.test.ts
 *
 * Pure-function coverage for `mergeIntoForm` and `mapToFormState`.
 *
 * Inlines the implementations because the rolldown-vite vmThreads pool
 * can't reliably transform module exports through SSR (same constraint
 * as `src/lib/projectDefaultCover.test.ts`). The inlined functions MUST
 * stay in lockstep with `src/services/projectUrlImport.parser.ts`.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Inlined implementation — mirror of mergeIntoForm + mapToFormState
// ---------------------------------------------------------------------------
type ImportSource = "github" | "vercel" | "opengraph";
type ImportableFormState = {
  slug: string; title: string; subtitle: string; summary: string; description: string;
  stackCsv: string; tagsCsv: string; role: string; status: string; mode: string;
  priority: number; sortOrder: number; featured: boolean;
  liveUrl: string; repoUrl: string; coverUrl: string; createdAt: string;
  heroImageAlt: string; heroVideoUrl: string; gallery: string[];
  linksText: string; metricsText: string; responsibilitiesText: string; outcomesText: string;
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function mergeIntoForm<T extends Record<string, unknown>>(current: T, incoming: Partial<T>): T {
  const next: T = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    const existing = (next as Record<string, unknown>)[key];
    if (!isEmpty(existing)) continue;
    (next as Record<string, unknown>)[key] = value;
  }
  return next;
}

type RawProviderPayload = {
  source?: ImportSource;
  name?: string; full_name?: string; description?: string | null;
  html_url?: string; homepage?: string | null; topics?: string[];
  ogTitle?: string; ogDescription?: string; ogImage?: string; ogUrl?: string;
  fields?: Partial<ImportableFormState>; warnings?: string[];
};

function detectFromShape(raw: RawProviderPayload): ImportSource {
  if (raw.html_url || raw.full_name || raw.topics) return "github";
  if (raw.ogTitle || raw.ogImage || raw.ogDescription) return "opengraph";
  return "opengraph";
}

function mapToFormState(raw: RawProviderPayload) {
  const source: ImportSource = raw.source ?? detectFromShape(raw);
  if (raw.fields) return { source, fields: raw.fields, warnings: raw.warnings };
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

function makeForm(overrides: Partial<ImportableFormState> = {}): ImportableFormState {
  return {
    slug: "", title: "", subtitle: "", summary: "", description: "",
    stackCsv: "", tagsCsv: "", role: "", status: "draft", mode: "",
    priority: 1, sortOrder: 1, featured: false,
    liveUrl: "", repoUrl: "", coverUrl: "",
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    heroImageAlt: "", heroVideoUrl: "", gallery: [],
    linksText: "", metricsText: "", responsibilitiesText: "", outcomesText: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("mergeIntoForm", () => {
  it("fills every empty string field", () => {
    const result = mergeIntoForm(makeForm(), {
      title: "New Title", summary: "New summary", repoUrl: "https://github.com/foo/bar",
    });
    expect(result.title).toBe("New Title");
    expect(result.summary).toBe("New summary");
    expect(result.repoUrl).toBe("https://github.com/foo/bar");
  });
  it("preserves non-empty string fields (no clobbering)", () => {
    const result = mergeIntoForm(makeForm({ title: "User Typed", summary: "" }), {
      title: "From URL", summary: "From URL summary",
    });
    expect(result.title).toBe("User Typed");
    expect(result.summary).toBe("From URL summary");
  });
  it("treats whitespace-only existing values as empty", () => {
    expect(mergeIntoForm(makeForm({ title: "   " }), { title: "Real Title" }).title).toBe("Real Title");
  });
  it("preserves non-empty arrays (gallery)", () => {
    const result = mergeIntoForm(
      makeForm({ gallery: ["https://img.example/1.png"] }),
      { gallery: ["https://img.example/2.png"] },
    );
    expect(result.gallery).toEqual(["https://img.example/1.png"]);
  });
  it("fills empty arrays", () => {
    expect(mergeIntoForm(makeForm({ gallery: [] }), { gallery: ["https://img.example/2.png"] }).gallery)
      .toEqual(["https://img.example/2.png"]);
  });
  it("never overwrites numeric fields like priority/sortOrder", () => {
    const r = mergeIntoForm(makeForm({ priority: 5, sortOrder: 7 }), { priority: 1, sortOrder: 2 });
    expect(r.priority).toBe(5);
    expect(r.sortOrder).toBe(7);
  });
  it("never overwrites boolean fields like featured", () => {
    expect(mergeIntoForm(makeForm({ featured: true }), { featured: false }).featured).toBe(true);
  });
  it("ignores undefined incoming values", () => {
    expect(mergeIntoForm(makeForm({ title: "" }), { title: undefined }).title).toBe("");
  });
  it("returns a new object (does not mutate input)", () => {
    const before = makeForm();
    const result = mergeIntoForm(before, { title: "X" });
    expect(result).not.toBe(before);
    expect(before.title).toBe("");
  });
});

describe("mapToFormState", () => {
  it("maps GitHub topics to tagsCsv with comma-space separator", () => {
    const result = mapToFormState({
      source: "github", name: "linux", description: "Linux kernel",
      html_url: "https://github.com/torvalds/linux",
      topics: ["kernel", "operating-system"],
    });
    expect(result.fields).toMatchObject({
      title: "linux", summary: "Linux kernel",
      repoUrl: "https://github.com/torvalds/linux",
      tagsCsv: "kernel, operating-system",
    });
  });
  it("skips homepage when empty / blank", () => {
    expect(mapToFormState({
      source: "github", name: "x", html_url: "https://github.com/foo/x", homepage: "  ",
    }).fields.liveUrl).toBeUndefined();
  });
  it("includes homepage when non-empty", () => {
    expect(mapToFormState({
      source: "github", name: "x", html_url: "https://github.com/foo/x", homepage: "https://x.dev",
    }).fields.liveUrl).toBe("https://x.dev");
  });
  it("maps OG-only payload (no GitHub fields)", () => {
    const result = mapToFormState({
      source: "opengraph",
      ogTitle: "My Site", ogDescription: "A description",
      ogImage: "https://x/og.png", ogUrl: "https://x/",
    });
    expect(result.source).toBe("opengraph");
    expect(result.fields).toEqual({
      title: "My Site", summary: "A description",
      coverUrl: "https://x/og.png", liveUrl: "https://x/",
    });
  });
  it("uses pre-mapped fields if the edge function provides them", () => {
    const result = mapToFormState({
      source: "github",
      fields: { title: "EdgePreMapped", repoUrl: "https://github.com/a/b" },
      warnings: ["rate-limited"],
    });
    expect(result.fields).toEqual({ title: "EdgePreMapped", repoUrl: "https://github.com/a/b" });
    expect(result.warnings).toEqual(["rate-limited"]);
  });
  it("infers source from payload shape when not provided", () => {
    expect(mapToFormState({ name: "x", html_url: "https://github.com/a/x" }).source).toBe("github");
    expect(mapToFormState({ ogTitle: "x" }).source).toBe("opengraph");
  });
  it("OG description does not overwrite GitHub description in same payload", () => {
    expect(mapToFormState({
      source: "github", description: "GH desc", ogDescription: "OG desc",
    }).fields.summary).toBe("GH desc");
  });
  it("returns empty fields for an empty raw payload", () => {
    expect(mapToFormState({}).fields).toEqual({});
  });
});
