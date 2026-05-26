import { requireAdmin } from "@/shared/lib/auth/server";
import { GlassCard } from "@/shared/ui/GlassCard";

export const metadata = { title: "MCP tools" };

type Tool = {
  name: string;
  description: string;
  status: "live" | "planned";
};

const TOOLS: Tool[] = [
  {
    name: "search_portfolio",
    description: "Cosine-similarity retrieval over public.embeddings (768-d Gemini chunks).",
    status: "live",
  },
  {
    name: "match_embeddings (RPC)",
    description:
      "Postgres RPC backing search_portfolio. Returns top-K rows >= min_score, security invoker, search_path = public, extensions.",
    status: "live",
  },
  {
    name: "fetch_project",
    description: "Read a single project row by slug (planned: tool wired in M8 if chatbot needs richer recall).",
    status: "planned",
  },
  {
    name: "recommend_projects",
    description: "Rank projects for a free-text role; today lives as /api/ai/recommend, planned to expose as a tool the chatbot can call directly.",
    status: "planned",
  },
];

export default async function AdminMcpPage() {
  await requireAdmin();

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Chatbot</p>
      <h1 className="text-h1 font-bold mt-2">MCP tools</h1>
      <p className="text-body text-muted mt-2 max-w-2xl">
        Read-only catalog of capabilities the RAG chatbot has (or will have)
        access to. Today the chatbot uses RAG retrieval only; the &quot;planned&quot;
        rows are tool-style endpoints already in the codebase that we can
        promote to first-class chatbot tools in M8 if useful.
      </p>

      <ul className="grid gap-3 mt-6">
        {TOOLS.map((t) => (
          <li key={t.name}>
            <GlassCard padding={5}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-h3 font-semibold">
                  <code className="font-mono">{t.name}</code>
                </p>
                <span
                  className={[
                    "text-caption px-2 py-0.5 rounded-pill border border-line",
                    t.status === "live" ? "text-[#10b981]" : "text-muted",
                  ].join(" ")}
                >
                  {t.status}
                </span>
              </div>
              <p className="text-body-sm text-muted mt-2">{t.description}</p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
