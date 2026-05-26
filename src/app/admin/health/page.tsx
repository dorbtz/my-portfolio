import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GlassCard } from "@/shared/ui/GlassCard";
import { hasAIProvider } from "@/shared/lib/ai/provider";
import { SyncEmbeddingsButton } from "./SyncEmbeddingsButton";
import { triggerEmbeddingsSync } from "./actions";

export const metadata = { title: "Health" };

async function getHealthStats() {
  const supabase = await createSupabaseServerClient();
  const [emb, tr, msgs] = await Promise.all([
    supabase.from("embeddings").select("source_table", { count: "exact" }),
    supabase.from("translations_cache").select("*", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("classification", { count: "exact", head: false })
      .limit(1000),
  ]);

  const embCount = emb.count ?? 0;
  // Roll up by source_table
  const embBy: Record<string, number> = {};
  for (const row of emb.data ?? []) {
    const k = (row as { source_table: string }).source_table;
    embBy[k] = (embBy[k] ?? 0) + 1;
  }

  const trCount = tr.count ?? 0;
  const msgsTotal = msgs.count ?? 0;
  const msgsBy: Record<string, number> = { unclassified: 0 };
  for (const row of msgs.data ?? []) {
    const c = (row as { classification: string | null }).classification;
    if (!c) msgsBy.unclassified += 1;
    else msgsBy[c] = (msgsBy[c] ?? 0) + 1;
  }

  return {
    embCount,
    embBy,
    trCount,
    msgsTotal,
    msgsBy,
    aiConfigured: hasAIProvider(),
  };
}

export default async function AdminHealthPage() {
  await requireAdmin();
  const s = await getHealthStats();

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Observability</p>
      <h1 className="text-h1 font-bold mt-2">Health</h1>
      <p className="text-body text-muted mt-2">
        Internal dash for the AI corpus + translation cache + inbox classifier. A
        public-friendly subset lives at <code>/status</code>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <GlassCard padding={5} className="admin-card">
          <p className="text-caption uppercase tracking-wider text-muted">AI provider</p>
          <p className="text-h3 font-semibold mt-1">
            {s.aiConfigured ? "Gemini (configured)" : "Not configured"}
          </p>
          <p className="text-caption text-muted mt-2">
            chat: gemini-2.5-flash · embed: gemini-embedding-001 (768d)
          </p>
        </GlassCard>

        <GlassCard padding={5} className="admin-card">
          <p className="text-caption uppercase tracking-wider text-muted">Embedding corpus</p>
          <p className="text-display font-bold leading-none mt-1">{s.embCount}</p>
          <ul className="mt-3 grid gap-1 text-body-sm text-muted">
            {Object.entries(s.embBy).map(([k, v]) => (
              <li key={k}>
                {k}: <span className="text-fg">{v}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard padding={5} className="admin-card">
          <p className="text-caption uppercase tracking-wider text-muted">Translations cached</p>
          <p className="text-display font-bold leading-none mt-1">{s.trCount}</p>
          <p className="text-caption text-muted mt-2">EN → HE pairs in translations_cache</p>
        </GlassCard>

        <GlassCard padding={5} className="admin-card sm:col-span-2">
          <p className="text-caption uppercase tracking-wider text-muted">Messages classifier</p>
          <p className="text-display font-bold leading-none mt-1">{s.msgsTotal}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {Object.entries(s.msgsBy)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <li
                  key={k}
                  className="px-2.5 py-1 rounded-pill text-body-sm border border-line text-fg"
                >
                  {k}: <span className="font-semibold">{v}</span>
                </li>
              ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard padding={6} className="admin-card mt-6">
        <h2 className="text-h2 font-semibold">Maintenance</h2>
        <p className="text-body-sm text-muted mt-1">
          Re-sync the embeddings table from the current content. Run after any
          project / about / skills edit so the chatbot answers using the latest
          copy.
        </p>
        <div className="mt-4">
          <SyncEmbeddingsButton action={triggerEmbeddingsSync} />
        </div>
      </GlassCard>
    </div>
  );
}
