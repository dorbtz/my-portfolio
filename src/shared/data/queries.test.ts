import { describe, expect, it } from "vitest";
import { PROJECT_FIXTURES } from "./projects";

/**
 * Fixture sanity. PROJECT_FIXTURES are the read-only fallback the public
 * pages render when Supabase is empty or unreachable. Anything that breaks
 * the shape contract here would 500 the public site in degraded mode.
 */
describe("projects fixtures", () => {
  it("has at least one shipped project (Lumen)", () => {
    const shipped = PROJECT_FIXTURES.filter((p) => p.status === "shipped");
    expect(shipped.length).toBeGreaterThanOrEqual(1);
    expect(shipped.some((p) => p.slug === "lumen")).toBe(true);
  });

  it("every fixture has the fields the UI reads", () => {
    for (const p of PROJECT_FIXTURES) {
      expect(typeof p.slug).toBe("string");
      expect(p.slug.length).toBeGreaterThan(0);
      expect(typeof p.title).toBe("string");
      expect(typeof p.tagline).toBe("string");
      expect(Array.isArray(p.stack)).toBe(true);
      expect(Array.isArray(p.tags)).toBe(true);
      expect(["draft", "in-progress", "shipped", "archived"]).toContain(p.status);
    }
  });

  it("featured projects are non-draft and have a real tagline", () => {
    for (const p of PROJECT_FIXTURES.filter((p) => p.featured)) {
      expect(p.status).not.toBe("draft");
      expect(p.status).not.toBe("archived");
      expect(p.tagline.length).toBeGreaterThan(0);
    }
  });

  it("slugs are unique (PK constraint mirrors Supabase)", () => {
    const slugs = PROJECT_FIXTURES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("priority is in [0, 100] range expected by /admin/content", () => {
    for (const p of PROJECT_FIXTURES) {
      expect(p.priority).toBeGreaterThanOrEqual(0);
      expect(p.priority).toBeLessThanOrEqual(100);
    }
  });
});
