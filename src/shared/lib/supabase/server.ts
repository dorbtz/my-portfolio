import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Per-request Supabase client for Server Components and Server Actions.
 * Respects the user's auth cookies so RLS policies evaluate correctly.
 *
 * Anon access is fine for the public read paths; the admin write paths
 * (M7) wrap this client in a Server Action with allowlist checks.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  // Prefer the canonical NEXT_PUBLIC_* names (used in Vercel env); fall back
  // to v1's VITE_* names so the local .env from the previous Vite app keeps
  // working without manual edits during the rebuild.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: CookieToSet[]) {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll is invoked from Server Components in some flows — Next
          // disallows cookie writes there. The auth flow re-invokes setAll
          // from middleware where writes are allowed, so it's safe to ignore.
        }
      },
    },
  });
}

/** True when both Supabase env vars are set. Used by query helpers to decide
 *  between a real query and a fixture fallback during local dev / preview. */
export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && anon);
}
