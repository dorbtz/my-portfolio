"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { requireAdmin } from "@/shared/lib/auth/server";
import { hasAIProvider } from "@/shared/lib/ai/provider";
import { syncCorpus } from "@/shared/lib/ai/rag";

export async function triggerEmbeddingsSync(): Promise<{
  ok: boolean;
  chunks?: number;
  error?: string;
}> {
  await requireAdmin();
  if (!hasAIProvider()) {
    return { ok: false, error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." };
  }
  try {
    const { chunks } = await syncCorpus();
    revalidatePath("/admin/health");
    return { ok: true, chunks };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Drop every cached HE translation. Use after upgrading the translation
 * prompt or model so the next HE visit re-generates with the new logic
 * (otherwise stale lower-quality translations stay served from cache).
 */
export async function purgeTranslationsCache(): Promise<{
  ok: boolean;
  deleted?: number;
  error?: string;
}> {
  await requireAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }
  try {
    const admin = createServerClient(url, serviceRole, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    // Count first so we can return how many we wiped.
    const { count } = await admin
      .from("translations_cache")
      .select("*", { count: "exact", head: true });
    // Use a never-match filter that still deletes everything; .neq on `key`
    // (always non-null PK) deletes all rows.
    const { error } = await admin
      .from("translations_cache")
      .delete()
      .neq("key", "__nope__");
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/health");
    revalidatePath("/");
    revalidatePath("/projects");
    return { ok: true, deleted: count ?? 0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
