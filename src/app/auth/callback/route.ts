/**
 * Supabase OAuth / magic-link callback.
 * The email magic-link redirects here with ?code=... ; we exchange the
 * code for a session and then bounce the user to ?next=... (or /admin).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?reason=missing_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/admin/login?reason=exchange_failed`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/admin/login?reason=exchange_failed`);
  }

  // Only allow same-origin redirect targets — never let `?next=` jump off-site.
  const dest = next.startsWith("/") ? next : "/admin";
  return NextResponse.redirect(`${origin}${dest}`);
}
