import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  /** Round 34 — extended fields */
  avatar_url?: string | null;
  email?: string | null;
  show_name?: boolean;
  show_username?: boolean;
  show_email?: boolean;
  show_avatar?: boolean;
};

type ProfileUpdate = {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  showName?: boolean;
  showUsername?: boolean;
  showEmail?: boolean;
  showAvatar?: boolean;
};

const PROFILE_COLUMNS =
  'id, username, display_name, avatar_url, email, show_name, show_username, show_email, show_avatar';

function normalizeUpdate(input: ProfileUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.username !== undefined) {
    const trimmed = typeof input.username === "string" ? input.username.trim() : input.username ?? null;
    payload.username = trimmed && trimmed.length ? trimmed : null;
  }
  if (input.displayName !== undefined) {
    const trimmed = typeof input.displayName === "string" ? input.displayName.trim() : input.displayName ?? null;
    payload.display_name = trimmed && trimmed.length ? trimmed : null;
  }
  if (input.avatarUrl !== undefined) {
    const trimmed = typeof input.avatarUrl === 'string' ? input.avatarUrl.trim() : input.avatarUrl ?? null;
    payload.avatar_url = trimmed && trimmed.length ? trimmed : null;
  }
  if (input.email !== undefined) {
    const trimmed = typeof input.email === 'string' ? input.email.trim().toLowerCase() : input.email ?? null;
    payload.email = trimmed && trimmed.length ? trimmed : null;
  }
  if (input.showName !== undefined)     payload.show_name = !!input.showName;
  if (input.showUsername !== undefined) payload.show_username = !!input.showUsername;
  if (input.showEmail !== undefined)    payload.show_email = !!input.showEmail;
  if (input.showAvatar !== undefined)   payload.show_avatar = !!input.showAvatar;
  return payload;
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.warn("[profiles] getProfile failed", error);
    return null;
  }
  return data as Profile | null;
}

export async function getProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (!unique.length) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", unique);
  if (error) {
    console.warn("[profiles] getProfilesByIds failed", error);
    return {};
  }
  const result: Record<string, Profile> = {};
  for (const row of data ?? []) {
    if (row?.id) {
      result[row.id] = row as Profile;
    }
  }
  return result;
}

/**
 * Check whether a username is available — i.e. NOT already claimed by
 * another profile. Returns true when free (or owned by `selfId` so the
 * current user can re-save their own row without seeing "taken").
 *
 * Read goes through anon RLS — `profiles.username` SELECT must be open
 * to authenticated users for this to work; the table policy already
 * allows `select` to authenticated.
 */
export async function isUsernameAvailable(
  candidate: string,
  selfId?: string,
): Promise<boolean> {
  const trimmed = candidate.trim();
  if (!trimmed) return true; // empty = "no username", which is fine.
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .maybeSingle();
  if (error) {
    console.warn("[profiles] isUsernameAvailable failed", error);
    // Fail-open: if the read fails for some reason, let the upsert decide
    // (the unique constraint on username will reject duplicates server-side).
    return true;
  }
  if (!data) return true;
  return Boolean(selfId && data.id === selfId);
}

export async function upsertProfile(id: string, update: ProfileUpdate): Promise<Profile | null> {
  if (!id) throw new Error("Missing profile id");
  const payload = { id, ...normalizeUpdate(update) };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    console.error("[profiles] upsertProfile failed", error);
    throw error;
  }
  return data as Profile;
}

/**
 * Change the signed-in admin's email.
 *
 * Two-step flow:
 *   1. supabase.auth.updateUser({ email }) — sends a confirmation link
 *      to BOTH the old and new addresses (Supabase requirement). The
 *      auth.users.email field doesn't actually flip until the user
 *      clicks the confirmation link from their new mailbox.
 *   2. Optimistically: update the cached `email` on profiles + swap the
 *      `admin_emails` row so Crew Roster reflects the change immediately,
 *      pushing the old email onto `previous_emails` for audit.
 *
 * The auth confirmation step is the source of truth for sign-in; the
 * mirror writes here keep the UI honest until that link is clicked.
 */
export async function changeOwnEmail(opts: {
  userId: string;
  oldEmail: string;
  newEmail: string;
}): Promise<{ confirmationSent: boolean }> {
  const newEmail = opts.newEmail.trim().toLowerCase();
  const oldEmail = opts.oldEmail.trim().toLowerCase();
  if (!newEmail) throw new Error('New email is required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
    throw new Error('That doesn’t look like a valid email address.');
  }
  if (newEmail === oldEmail) throw new Error('That is already your email address.');

  // 1. Kick off the auth email change (sends confirmation links).
  const { error: authErr } = await supabase.auth.updateUser({ email: newEmail });
  if (authErr) throw authErr;

  // 2. Mirror into profiles.email (best-effort).
  try {
    await upsertProfile(opts.userId, { email: newEmail });
  } catch (err) {
    console.warn('[profiles] mirror email to profiles.email failed', err);
  }

  // 3. Sync admin_emails — push old email onto previous_emails, flip the
  //    PK to the new email. Done as a delete+insert because email is the
  //    table's primary key.
  if (oldEmail) {
    try {
      const { data: existing } = await supabase
        .from('admin_emails')
        .select('email, previous_emails')
        .eq('email', oldEmail)
        .maybeSingle();
      const history: string[] = Array.isArray(existing?.previous_emails)
        ? (existing!.previous_emails as string[])
        : [];
      // Newest first; de-dupe.
      const nextHistory = [oldEmail, ...history.filter((e) => e !== oldEmail)];
      // Insert the new row first (so we never lose admin coverage).
      await supabase.from('admin_emails').upsert(
        { email: newEmail, previous_emails: nextHistory },
        { onConflict: 'email' },
      );
      // Then delete the old one (only if it was actually present).
      if (existing) {
        await supabase.from('admin_emails').delete().eq('email', oldEmail);
      }
    } catch (err) {
      console.warn('[profiles] sync admin_emails after email change failed', err);
    }
  }

  return { confirmationSent: true };
}
