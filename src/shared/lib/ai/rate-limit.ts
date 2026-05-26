/**
 * Per-IP rate limiter for AI endpoints.
 *
 * Phase-1 implementation: in-memory bucket. Single-instance only — fine for
 * local dev + the Vercel Free/Hobby tier where Functions cold-start often
 * (limits are best-effort, not hard SLAs). Phase 2 (M6 or M7) swaps the
 * backing store for Supabase `message_rate_limit` so it survives cold-starts.
 *
 * Returned `ok=false` should respond 429 with `Retry-After` in seconds.
 */

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Logical key for the limit (route + ip). */
  key: string;
  /** Max requests per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number; resetIn: number }
  | { ok: false; retryAfter: number };

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const b = buckets.get(opts.key);
  if (!b || now - b.windowStart > windowMs) {
    buckets.set(opts.key, { count: 1, windowStart: now });
    return { ok: true, remaining: opts.limit - 1, resetIn: opts.windowSec };
  }
  if (b.count >= opts.limit) {
    const retryAfter = Math.ceil((b.windowStart + windowMs - now) / 1000);
    return { ok: false, retryAfter };
  }
  b.count += 1;
  return {
    ok: true,
    remaining: opts.limit - b.count,
    resetIn: Math.ceil((b.windowStart + windowMs - now) / 1000),
  };
}

/** Extract a best-effort visitor identifier from request headers. */
export function clientKey(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anon"
  );
}
