"use server";

import { revalidatePath } from "next/cache";
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
