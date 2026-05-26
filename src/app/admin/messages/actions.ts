"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function markRead(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false };
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleArchive(id: string, nextArchived: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("messages")
    .update({ archived: nextArchived })
    .eq("id", id);
  if (error) return { ok: false };
  revalidatePath("/admin/messages");
  return { ok: true };
}
