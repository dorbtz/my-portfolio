/**
 * Next.js middleware — runs on every request whose path matches the
 * `config.matcher` below. Two jobs:
 *
 *   1. Refresh the Supabase auth session cookies so SSR layouts always
 *      see a current session (access tokens expire every hour).
 *   2. Gate /admin/** routes behind a logged-in + allowlisted session.
 *      Unauthenticated visitors get redirected to /admin/login.
 *      Logged-in but non-allowlisted users get a friendly bounce
 *      back to /admin/login with ?reason=not_allowlisted.
 *
 * Allowlist check happens here AND in requireAdmin() inside admin
 * Server Components — defense in depth. The middleware check stops
 * the layout from even rendering when unauthorized.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/shared/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  if (!supabase) return response;

  // ALWAYS call getUser() in middleware so the auth session is refreshed.
  // (Even on non-admin routes — keeps the cookie fresh for /admin nav.)
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { pathname } = request.nextUrl;

  // Login page itself + the OAuth callback are public.
  const isAdminAuthSurface =
    pathname === "/admin/login" || pathname.startsWith("/auth/callback");

  if (pathname.startsWith("/admin") && !isAdminAuthSurface) {
    if (!user || !user.email) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Quick allowlist check — single small query.
    const { data: allowed } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("reason", "not_allowlisted");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Run on /admin/**, /auth/**, and root-ish navs so session refresh
  // happens before SSR. Skip static assets + Next internals.
  matcher: ["/admin/:path*", "/auth/:path*", "/((?!_next/static|_next/image|favicon|assets|.*\\..*).*)"],
};
