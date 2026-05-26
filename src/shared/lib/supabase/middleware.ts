/**
 * Per-request Supabase client for middleware. Refreshes the Supabase
 * auth session cookies on every request that touches /admin or /auth so
 * the SSR layout sees a current session without the user re-logging in
 * after the access token expires.
 *
 * Returns both the client and the response so middleware can attach
 * the refreshed cookies + decide whether to redirect.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  // Start with a fresh NextResponse that we'll thread cookies into.
  let response = NextResponse.next({ request });

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Misconfigured env — let middleware proceed; the request handlers
    // surface the missing-env error to the user.
    return { supabase: null, response };
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
        // Re-create the response so we can attach the refreshed cookies.
        // (NextResponse.cookies.set returns the same response, mutating it.)
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response };
}
