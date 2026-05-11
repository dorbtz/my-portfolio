/**
 * src/services/adminAllowlist.ts
 *
 * Lightweight client-side gate for the admin sign-in flow. Queries the
 * public.admin_emails table (RLS allows SELECT for everyone) to determine
 * whether the typed email is permitted to receive a magic link.
 *
 * Server-side enforcement still lives in the RLS policies on
 * public.projects / public.profiles (see migration 0003_admin_allowlist.sql);
 * this client check is purely a UX nicety so non-allowlisted users get a
 * polite error instead of a useless magic link in their inbox.
 *
 * Caching: 60 seconds in-memory. The allowlist changes rarely and we do not
 * want to hammer Supabase on every keystroke. The cache is shared across
 * the module's lifetime.
 */
import { supabase } from "../lib/supabase";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  emails: Set<string>;
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inflight: Promise<Set<string>> | null = null;

/**
 * Fetch the allowlist from Supabase, returning a Set of lowercased emails.
 * Cached for 60s. Concurrent calls share the same in-flight promise.
 */
export async function getAdminAllowlist(): Promise<Set<string>> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.emails;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from("admin_emails")
        .select("email");
      if (error) throw error;
      const emails = new Set<string>(
        (data ?? []).map((row: { email: string }) => row.email.trim().toLowerCase()),
      );
      cache = { emails, fetchedAt: Date.now() };
      return emails;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Returns true if `email` is in the allowlist.
 * Case-insensitive; trims whitespace.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  const allow = await getAdminAllowlist();
  return allow.has(trimmed);
}

/** Force-clear the cache (test seam / used after mutation). */
export function clearAdminAllowlistCache(): void {
  cache = null;
  inflight = null;
}
