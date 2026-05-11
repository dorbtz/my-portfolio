/**
 * src/services/projectUrlImport.network.test.ts
 *
 * Verifies the contract that `importFromUrl` is built around:
 *   - calls `supabase.functions.invoke('parse-url', { body: { url } })`
 *   - propagates `source` from the response
 *   - throws on edge-function error / null data
 *   - rejects empty + SSRF URLs without invoking the edge function
 *   - times out via AbortController after `timeoutMs`
 *
 * Inlines the function-under-test (with an injected supabase stub) because
 * the rolldown-vite vmThreads pool can't reliably transform module exports
 * through SSR (same constraint as `src/lib/easterEggs.test.ts`). The
 * inlined logic MUST stay in lockstep with `src/services/projectUrlImport.ts`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Inlined SSRF guard (matches projectUrlImport.parser.ts)
// ---------------------------------------------------------------------------
const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::", "::1"]);
function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
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
  if (isPrivateIPv4(host)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Inlined importFromUrl — mirror of src/services/projectUrlImport.ts
// ---------------------------------------------------------------------------
type SupabaseLike = {
  functions: {
    invoke: (
      name: string,
      opts: { body: unknown; signal?: AbortSignal },
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
};

async function importFromUrlWith(
  supa: SupabaseLike,
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<unknown> {
  if (!url || !url.trim()) throw new Error("Paste a URL first.");
  if (isPrivateUrl(url)) {
    throw new Error("That URL points to a private/internal address — refusing to fetch.");
  }
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { data, error } = await supa.functions.invoke("parse-url", {
      body: { url },
      signal: controller.signal,
    });
    if (error) throw new Error(error.message || "URL import failed");
    if (!data) throw new Error("URL import returned no data");
    return data;
  } catch (err) {
    if (controller.signal.aborted) throw new Error("URL import timed out — try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
const invokeMock = vi.fn();
const fakeSupabase: SupabaseLike = { functions: { invoke: invokeMock } };

beforeEach(() => {
  invokeMock.mockReset();
});

describe("importFromUrl", () => {
  it("invokes the parse-url edge function with the URL in the body", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { source: "github", fields: { title: "x" } },
      error: null,
    });
    const result = (await importFromUrlWith(fakeSupabase, "https://github.com/foo/bar")) as {
      source: string; fields: Record<string, unknown>;
    };
    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [name, opts] = invokeMock.mock.calls[0];
    expect(name).toBe("parse-url");
    expect(opts.body).toEqual({ url: "https://github.com/foo/bar" });
    expect(result.source).toBe("github");
    expect(result.fields).toEqual({ title: "x" });
  });

  it("propagates source: 'vercel'", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { source: "vercel", fields: { title: "my-app" }, warnings: [] },
      error: null,
    });
    const r = (await importFromUrlWith(fakeSupabase, "https://my-app.vercel.app")) as { source: string };
    expect(r.source).toBe("vercel");
  });

  it("propagates source: 'opengraph'", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { source: "opengraph", fields: { title: "Some Page" } },
      error: null,
    });
    const r = (await importFromUrlWith(fakeSupabase, "https://example.com/page")) as { source: string };
    expect(r.source).toBe("opengraph");
  });

  it("throws when the edge function returns an error", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: "rate limited" } });
    await expect(importFromUrlWith(fakeSupabase, "https://github.com/a/b"))
      .rejects.toThrow(/rate limited/);
  });

  it("throws when the edge function returns no data", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(importFromUrlWith(fakeSupabase, "https://github.com/a/b"))
      .rejects.toThrow(/no data/i);
  });

  it("rejects empty URLs before invoking the edge function", async () => {
    await expect(importFromUrlWith(fakeSupabase, "")).rejects.toThrow(/paste a url/i);
    await expect(importFromUrlWith(fakeSupabase, "   ")).rejects.toThrow(/paste a url/i);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("rejects SSRF-probe URLs client-side without invoking", async () => {
    await expect(importFromUrlWith(fakeSupabase, "http://127.0.0.1"))
      .rejects.toThrow(/private|internal/i);
    await expect(importFromUrlWith(fakeSupabase, "file:///etc/passwd"))
      .rejects.toThrow(/private|internal/i);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("times out via AbortController and rethrows a friendly message", async () => {
    invokeMock.mockImplementation((_name: string, opts: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        opts.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    });
    await expect(importFromUrlWith(fakeSupabase, "https://example.com", { timeoutMs: 25 }))
      .rejects.toThrow(/timed out/i);
  });
});
