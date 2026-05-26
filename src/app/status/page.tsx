import type { Metadata } from "next";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/shared/lib/supabase/server";
import { hasAIProvider } from "@/shared/lib/ai/provider";
import { GlassCard } from "@/shared/ui/GlassCard";
import { Section } from "@/shared/ui/Section";

export const metadata: Metadata = {
  title: "Status",
  description: "Public health snapshot of dorbtz.com — services, AI corpus, last build.",
};

async function getPublicStatus() {
  const ai = hasAIProvider();
  if (!hasSupabaseEnv()) {
    return { db: "down" as const, ai, embeddings: 0, projects: 0 };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const [emb, proj] = await Promise.all([
      supabase.from("embeddings").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).neq("status", "archived"),
    ]);
    return {
      db: "up" as const,
      ai,
      embeddings: emb.count ?? 0,
      projects: proj.count ?? 0,
    };
  } catch {
    return { db: "down" as const, ai, embeddings: 0, projects: 0 };
  }
}

function StatusDot({ up }: { up: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
      style={{ background: up ? "#10b981" : "#ef4444" }}
    />
  );
}

export default async function StatusPage() {
  const s = await getPublicStatus();

  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="Status">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">Public</p>
        <h1 className="text-display font-bold tracking-tight mt-2">Status</h1>
        <p className="text-body text-muted mt-2 max-w-2xl">
          Live snapshot of the services this site depends on. Anyone can look —
          no login required.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mt-6 max-w-2xl">
          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">Database</p>
            <p className="text-h3 font-semibold mt-1">
              <StatusDot up={s.db === "up"} />
              {s.db === "up" ? "Operational" : "Unreachable"}
            </p>
            <p className="text-caption text-muted mt-2">Supabase Postgres + RLS</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">AI co-pilot</p>
            <p className="text-h3 font-semibold mt-1">
              <StatusDot up={s.ai} />
              {s.ai ? "Operational" : "Offline"}
            </p>
            <p className="text-caption text-muted mt-2">Gemini 2.5 Flash · 768d embeddings</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">RAG corpus</p>
            <p className="text-display font-bold leading-none mt-1">{s.embeddings}</p>
            <p className="text-caption text-muted mt-2">chunks indexed</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">Live projects</p>
            <p className="text-display font-bold leading-none mt-1">{s.projects}</p>
            <p className="text-caption text-muted mt-2">non-archived</p>
          </GlassCard>
        </div>
      </Section>
    </main>
  );
}
