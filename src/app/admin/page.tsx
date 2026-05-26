import Link from "next/link";
import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GlassCard } from "@/shared/ui/GlassCard";

export const metadata = { title: "Dashboard" };

type DashStats = {
  totalMessages: number;
  unreadMessages: number;
  totalProjects: number;
  embeddingsCount: number;
  translationsCount: number;
  allowlistCount: number;
};

async function getStats(): Promise<DashStats> {
  const supabase = await createSupabaseServerClient();
  const [m, mu, p, e, tr, al] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }).is("read_at", null).eq("archived", false),
    supabase.from("projects").select("*", { count: "exact", head: true }).neq("status", "archived"),
    supabase.from("embeddings").select("*", { count: "exact", head: true }),
    supabase.from("translations_cache").select("*", { count: "exact", head: true }),
    supabase.from("admin_emails").select("*", { count: "exact", head: true }),
  ]);
  return {
    totalMessages: m.count ?? 0,
    unreadMessages: mu.count ?? 0,
    totalProjects: p.count ?? 0,
    embeddingsCount: e.count ?? 0,
    translationsCount: tr.count ?? 0,
    allowlistCount: al.count ?? 0,
  };
}

function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <GlassCard padding={5} className="h-full transition-transform duration-snap ease-snap hover:-translate-y-0.5">
      <p className="text-caption uppercase tracking-wider text-muted">{label}</p>
      <p className="text-display font-bold mt-1 leading-none">{value}</p>
      {hint && <p className="text-caption text-muted mt-2">{hint}</p>}
    </GlassCard>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-none rounded-lg">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const stats = await getStats();

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Admin</p>
      <h1 className="text-h1 font-bold mt-2">Dashboard</h1>
      <p className="text-body text-muted mt-2">
        Hi {user.email.split("@")[0]} — site health at a glance.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <StatCard
          label="Unread messages"
          value={stats.unreadMessages}
          href="/admin/messages"
          hint={`of ${stats.totalMessages} total`}
        />
        <StatCard
          label="Live projects"
          value={stats.totalProjects}
          href="/admin/content"
          hint="non-archived"
        />
        <StatCard
          label="RAG embeddings"
          value={stats.embeddingsCount}
          href="/admin/health"
          hint="chunks indexed in pgvector"
        />
        <StatCard
          label="Cached translations"
          value={stats.translationsCount}
          hint="EN → HE pairs"
        />
        <StatCard
          label="Admins"
          value={stats.allowlistCount}
          href="/admin/account"
          hint="allowlisted emails"
        />
        <StatCard
          label="MCP tools"
          value="Chatbot only"
          href="/admin/mcp"
          hint="exposed to the RAG bot"
        />
      </div>
    </div>
  );
}
