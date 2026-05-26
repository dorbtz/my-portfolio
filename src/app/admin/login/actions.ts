"use server";

/**
 * Admin auth Server Actions: magic link + password + username sign-in.
 *
 * All three are pre-checked against `admin_emails` so non-allowlisted
 * visitors never even get a Supabase auth call (the RLS gate on the
 * client side already protects against typos / probing). The actual
 * authorization gate is `is_admin()` on every write + the middleware
 * + `requireAdmin()` in admin Server Components.
 */
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();

  // Pre-check the allowlist client-side so we don't send useless OTPs.
  const { data: allowed } = await supabase
    .from("admin_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (!allowed) {
    return {
      ok: false,
      error: "This email isn't on the admin allowlist. Contact Dor if you should be added.",
    };
  }

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/admin` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInWithPassword(formData: FormData): Promise<Result> {
  const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!identifier) return { ok: false, error: "Enter your email or username." };
  if (!password) return { ok: false, error: "Enter your password." };

  const supabase = await createSupabaseServerClient();

  // Email path: pre-check allowlist for friendlier error.
  let email: string | null = null;
  if (identifier.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return { ok: false, error: "That email doesn't look right." };
    }
    const { data: allowed } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", identifier)
      .maybeSingle();
    if (!allowed) {
      return {
        ok: false,
        error: "This email isn't on the admin allowlist.",
      };
    }
    email = identifier;
  } else {
    // Username path: resolve via RPC (server-side enforced).
    const { data, error: rpcErr } = await supabase.rpc(
      "lookup_admin_email_by_username",
      { p_username: identifier }
    );
    if (rpcErr || !data || typeof data !== "string") {
      // Generic message so we don't enumerate usernames.
      return { ok: false, error: "Username not found or not an admin." };
    }
    email = data;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email!,
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
