/**
 * src/services/auth.ts
 *
 * Auth surface for the admin panel. Three sign-in flows are supported:
 *
 *   1. Magic link (email-only OTP) — first-time sign-in, no password needed.
 *      Used for onboarding new admins added via the Allowlist page.
 *   2. Email + password — for admins who set a password via /admin/account.
 *   3. Username + password — same as (2) but resolves the username to its
 *      backing admin email via the `lookup_admin_email_by_username` RPC
 *      (migration 0009). The RPC server-side enforces "must be in the
 *      allowlist" so non-admin usernames return NULL.
 *
 * Allowlist enforcement is layered: the client pre-checks email-based
 * sign-ins via `adminAllowlist.isEmailAllowed`; for username sign-ins the
 * RPC's allowlist join is the authoritative gate (the client never sees
 * the email until the RPC has validated it).
 */
import { supabase } from "../lib/supabase";

/** Minimum password length enforced client-side; server also enforces. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Send a magic-link OTP to the given email. The link redirects back to
 * `/admin` after a successful sign-in. Used for first-time admin onboarding.
 */
export async function signInWithEmail(email: string) {
  // Update this to your production site origin in Supabase Auth settings later
  const redirectTo = `${window.location.origin}/admin`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return true;
}

/**
 * Sign in directly with an email + password. Server validates against the
 * admin_emails allowlist via the row-level security policies on every
 * write — this method itself does not pre-check the allowlist (do that in
 * the caller). On success the auth state changes; the caller should
 * navigate to `/admin`.
 */
export async function signInWithEmailAndPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

/**
 * Sign in by username + password. Resolves the username to its backing
 * admin email via the SECURITY DEFINER RPC, then performs a normal
 * password sign-in. Throws a generic error if the username doesn't
 * resolve to an allowlisted admin (so we never enumerate users).
 */
export async function signInWithUsernameAndPassword(username: string, password: string) {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) throw new Error('Username is required.');

  const { data, error } = await supabase.rpc('lookup_admin_email_by_username', {
    p_username: trimmed,
  });
  if (error) throw error;
  // RPC returns NULL on miss (unknown username OR not in allowlist).
  // Don't reveal which — show a generic message.
  if (!data || typeof data !== 'string') {
    throw new Error('Username not found or not an admin.');
  }
  return signInWithEmailAndPassword(data, password);
}

/**
 * Set or change the signed-in user's password. Requires an active session
 * (so we never expose an unauthenticated password setter). Validates the
 * minimum length client-side; Supabase also enforces server-side.
 */
export async function setOwnPassword(password: string) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return true;
}

export async function signOut() {
  await supabase.auth.signOut();
}
