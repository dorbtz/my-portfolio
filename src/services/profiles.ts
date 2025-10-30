import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type ProfileUpdate = {
  username?: string | null;
  displayName?: string | null;
};

function normalizeUpdate(input: ProfileUpdate): { username?: string | null; display_name?: string | null } {
  const payload: { username?: string | null; display_name?: string | null } = {};
  if (input.username !== undefined) {
    const trimmed = typeof input.username === "string" ? input.username.trim() : input.username ?? null;
    payload.username = trimmed && trimmed.length ? trimmed : null;
  }
  if (input.displayName !== undefined) {
    const trimmed = typeof input.displayName === "string" ? input.displayName.trim() : input.displayName ?? null;
    payload.display_name = trimmed && trimmed.length ? trimmed : null;
  }
  return payload;
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
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
    .select("id, username, display_name")
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

export async function upsertProfile(id: string, update: ProfileUpdate): Promise<Profile | null> {
  if (!id) throw new Error("Missing profile id");
  const payload = { id, ...normalizeUpdate(update) };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, username, display_name")
    .single();
  if (error) {
    console.error("[profiles] upsertProfile failed", error);
    throw error;
  }
  return data as Profile;
}
