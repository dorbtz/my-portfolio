import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GlassCard } from "@/shared/ui/GlassCard";
import { markRead, toggleArchive } from "./actions";
import { MessageActions } from "./MessageActions";

export const metadata = { title: "Messages" };

type MessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  classification: string | null;
  suggested_reply: string | null;
  classified_at: string | null;
  read_at: string | null;
  archived: boolean;
  created_at: string;
};

const CLASS_TINT: Record<string, string> = {
  recruiter: "#10b981",
  collaboration: "#3b82f6",
  question: "#7c3aed",
  spam: "#ef4444",
  other: "var(--color-text-muted)",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id,name,email,message,classification,suggested_reply,classified_at,read_at,archived,created_at"
    )
    .order("created_at", { ascending: false });

  const rows: MessageRow[] = !error && Array.isArray(data) ? (data as MessageRow[]) : [];

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Inbox</p>
      <h1 className="text-h1 font-bold mt-2">Messages</h1>
      <p className="text-body text-muted mt-2">
        {rows.length} total. Classification + suggested reply tone are generated
        by Gemini in the background after each submission.
      </p>

      {rows.length === 0 && (
        <GlassCard padding={6} className="mt-6">
          <p className="text-body text-muted">No messages yet.</p>
        </GlassCard>
      )}

      <ul className="grid gap-4 mt-6">
        {rows.map((m) => {
          const unread = m.read_at === null;
          const tint = m.classification ? CLASS_TINT[m.classification] ?? CLASS_TINT.other : null;
          return (
            <li key={m.id}>
              <GlassCard padding={5} className={m.archived ? "opacity-60" : ""}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {unread && (
                        <span className="text-caption uppercase tracking-wider text-accent font-semibold">
                          NEW
                        </span>
                      )}
                      <p className="text-h3 font-semibold truncate">{m.name}</p>
                      <a
                        href={`mailto:${m.email}`}
                        className="text-body-sm text-muted hover:text-accent transition-colors"
                      >
                        {m.email}
                      </a>
                    </div>
                    <p className="text-caption text-muted mt-1">{formatDate(m.created_at)}</p>
                  </div>
                  {tint && m.classification && (
                    <span
                      className="text-caption px-2 py-1 rounded-pill border border-line"
                      style={{ color: tint, borderColor: tint }}
                    >
                      {m.classification}
                    </span>
                  )}
                </div>

                <p className="text-body text-fg mt-3 whitespace-pre-wrap">{m.message}</p>

                {m.suggested_reply && (
                  <div className="mt-4 p-3 rounded-md border border-line bg-[color-mix(in_oklab,var(--color-text)_3%,transparent)]">
                    <p className="text-caption uppercase tracking-wider text-muted">
                      AI reply suggestion
                    </p>
                    <p className="text-body-sm text-fg mt-1">{m.suggested_reply}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-3 flex-wrap">
                  <MessageActions
                    id={m.id}
                    unread={unread}
                    archived={m.archived}
                    markRead={markRead}
                    toggleArchive={toggleArchive}
                  />
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
