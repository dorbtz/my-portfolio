import type { Metadata } from "next";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/shared/lib/supabase/server";
import { hasAIProvider } from "@/shared/lib/ai/provider";
import { GlassCard } from "@/shared/ui/GlassCard";
import { Section } from "@/shared/ui/Section";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

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

const EYEBROW = "Public";
const TITLE = "Status";
const BODY = "Live snapshot of the services this site depends on. Anyone can look — no login required.";
const L_DB = "Database";
const L_AI = "AI co-pilot";
const L_CORPUS = "RAG corpus";
const L_PROJECTS = "Live projects";
const S_OPERATIONAL = "Operational";
const S_UNREACHABLE = "Unreachable";
const S_OFFLINE = "Offline";
const H_DB = "Supabase Postgres + RLS";
const H_AI = "Gemini 2.5 Flash · 768d embeddings";
const H_CORPUS = "chunks indexed";
const H_PROJECTS = "non-archived";

export default async function StatusPage() {
  const [{ locale }, s] = await Promise.all([readThemeState(), getPublicStatus()]);
  const t = await localize(locale, [
    { en: EYEBROW, contentType: "status.eyebrow" },
    { en: TITLE, contentType: "status.title" },
    { en: BODY, contentType: "status.body" },
    { en: L_DB, contentType: "status.label" },
    { en: L_AI, contentType: "status.label" },
    { en: L_CORPUS, contentType: "status.label" },
    { en: L_PROJECTS, contentType: "status.label" },
    { en: S_OPERATIONAL, contentType: "status.state" },
    { en: S_UNREACHABLE, contentType: "status.state" },
    { en: S_OFFLINE, contentType: "status.state" },
    { en: H_DB, contentType: "status.hint" },
    { en: H_AI, contentType: "status.hint" },
    { en: H_CORPUS, contentType: "status.hint" },
    { en: H_PROJECTS, contentType: "status.hint" },
  ]);

  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="Status">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(EYEBROW)}</p>
        <h1 className="text-display font-bold tracking-tight mt-2">{t(TITLE)}</h1>
        <p className="text-body text-muted mt-2 max-w-2xl">{t(BODY)}</p>

        <div className="grid gap-4 sm:grid-cols-2 mt-6 max-w-2xl">
          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">{t(L_DB)}</p>
            <p className="text-h3 font-semibold mt-1">
              <StatusDot up={s.db === "up"} />
              {s.db === "up" ? t(S_OPERATIONAL) : t(S_UNREACHABLE)}
            </p>
            <p className="text-caption text-muted mt-2">{t(H_DB)}</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">{t(L_AI)}</p>
            <p className="text-h3 font-semibold mt-1">
              <StatusDot up={s.ai} />
              {s.ai ? t(S_OPERATIONAL) : t(S_OFFLINE)}
            </p>
            <p className="text-caption text-muted mt-2">{t(H_AI)}</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">{t(L_CORPUS)}</p>
            <p className="text-display font-bold leading-none mt-1">{s.embeddings}</p>
            <p className="text-caption text-muted mt-2">{t(H_CORPUS)}</p>
          </GlassCard>

          <GlassCard padding={5}>
            <p className="text-caption uppercase tracking-wider text-muted">{t(L_PROJECTS)}</p>
            <p className="text-display font-bold leading-none mt-1">{s.projects}</p>
            <p className="text-caption text-muted mt-2">{t(H_PROJECTS)}</p>
          </GlassCard>
        </div>
      </Section>
    </main>
  );
}
