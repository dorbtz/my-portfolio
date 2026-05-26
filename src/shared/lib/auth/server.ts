/**
 * Server-side auth helpers for Server Components and Server Actions.
 *
 * - getSessionUser(): current authed user (or null) — read-only, fast.
 * - isAllowlistedAdmin(email): SQL check against admin_emails — single round trip.
 * - requireAdmin(): assert admin or redirect to /admin/login. Use in admin Server
 *   Components + Server Actions for defense-in-depth (middleware also gates).
 */
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
};

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export async function isAllowlistedAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (error) return false;
    return Boolean(data?.email);
  } catch {
    return false;
  }
}

/**
 * Gate: require an admin session, or redirect to the login page.
 * Use at the top of every admin Server Component / Server Action.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const ok = await isAllowlistedAdmin(user.email);
  if (!ok) redirect("/admin/login?reason=not_allowlisted");
  return user;
}
