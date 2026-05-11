/**
 * src/features/admin-dashboard/services/dashboardStats.ts
 *
 * Aggregates counts and a unified "recent activity" timeline for the
 * /admin landing page. All queries are RLS-gated server-side so calling
 * this from a non-admin session returns zeros / empty arrays rather than
 * throwing.
 *
 * Performance: the count + last-edit fetch fans out as Promise.all so
 * the dashboard hydrates in a single round-trip wall-clock.
 */
import { supabase } from '../../../shared/lib/supabase';

// Round 74 — narrow row shapes so dashboardStats.ts is `any`-free. Each
// shape mirrors the columns selected in the corresponding query above.
type ProjectRow = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};
type SiteContentRow = {
  id: string | number;
  section?: string | null;
  field?: string | null;
  mode?: string | null;
  updated_at?: string | null;
};
type MessageRow = {
  id: string | number;
  name?: string | null;
  mode?: string | null;
  created_at?: string | null;
};

// Generic Supabase filter callback shape — we don't depend on the full
// PostgrestFilterBuilder type because we only use a narrow subset
// (`.is(...)`, `.eq(...)`) and want this file to stay decoupled from
// supabase-js generics churn.
type CountQuery = {
  is(column: string, value: unknown): CountQuery;
  eq(column: string, value: unknown): CountQuery;
};

export type DashboardCounts = {
  projects: number;
  siteContent: number;
  messages: number;
  messagesUnread: number;
  admins: number;
};

export type ActivityItem = {
  id: string;
  /** ISO timestamp — newest first when sorted. */
  timestamp: string;
  source: 'project' | 'site_content' | 'message';
  title: string;
  detail: string;
};

const EMPTY_COUNTS: DashboardCounts = {
  projects: 0,
  siteContent: 0,
  messages: 0,
  messagesUnread: 0,
  admins: 0,
};

/**
 * Single round-trip count query. Uses Supabase head: true so the rows
 * payload is empty — only the count comes back over the wire.
 */
async function countTable(
  table: string,
  extraFilter?: (q: CountQuery) => CountQuery,
): Promise<number> {
  // The supabase-js builder is structurally compatible with `CountQuery`
  // for the methods we use; cast through `unknown` to avoid leaking the
  // full PostgrestFilterBuilder generic surface up to the callers.
  let q = supabase.from(table).select('*', { count: 'exact', head: true }) as unknown as CountQuery;
  if (extraFilter) q = extraFilter(q);
  const { count, error } = (await (q as unknown as Promise<{ count: number | null; error: unknown }>));
  if (error) {
    // Tables that don't exist yet (e.g. messages before migration applied)
    // shouldn't break the dashboard — just contribute 0.
    return 0;
  }
  return count ?? 0;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  try {
    const [projects, siteContent, messages, messagesUnread, admins] = await Promise.all([
      countTable('projects'),
      countTable('site_content'),
      countTable('messages'),
      countTable('messages', (q) => q.is('read_at', null).eq('archived', false)),
      countTable('admin_emails'),
    ]);
    return { projects, siteContent, messages, messagesUnread, admins };
  } catch {
    return EMPTY_COUNTS;
  }
}

/**
 * Returns the most recent updated_at across the three editable tables,
 * unified into a single timeline. Limit 10 by default.
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const items: ActivityItem[] = [];

  try {
    const [{ data: projects }, { data: siteContent }, { data: messages }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, title, slug, updated_at, created_at')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('site_content')
        // Round 35 fix: column is `field`, not `key` (typo from earlier
        // round caused 400 Bad Request on every dashboard refresh).
        .select('id, section, field, mode, updated_at')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('messages')
        .select('id, name, mode, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    for (const p of (projects ?? []) as ProjectRow[]) {
      const ts = p.updated_at ?? p.created_at;
      if (!ts) continue;
      items.push({
        id: `project-${p.id}`,
        timestamp: ts,
        source: 'project',
        title: `Project: ${p.title ?? p.slug ?? 'Untitled'}`,
        detail: 'Updated dossier',
      });
    }

    for (const c of (siteContent ?? []) as SiteContentRow[]) {
      const ts = c.updated_at;
      if (!ts) continue;
      const section = c.section ?? 'unknown';
      const field = c.field ?? '';
      const mode = c.mode ?? '';
      items.push({
        id: `content-${c.id}`,
        timestamp: ts,
        source: 'site_content',
        title: `Content: ${section}${field ? ` / ${field}` : ''}`,
        detail: mode ? `Edited ${mode} copy` : 'Edited copy',
      });
    }

    for (const m of (messages ?? []) as MessageRow[]) {
      const ts = m.created_at;
      if (!ts) continue;
      items.push({
        id: `message-${m.id}`,
        timestamp: ts,
        source: 'message',
        title: `Message from ${m.name ?? 'visitor'}`,
        detail: m.mode ? `via ${m.mode} mode` : 'New message',
      });
    }
  } catch {
    // Bare-bones graceful degrade — empty timeline.
  }

  items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return items.slice(0, limit);
}

/**
 * The wall-clock ISO timestamp of the most recent edit anywhere in the CMS.
 * Used by the "Last edit" stat tile.
 */
export async function getLastEditTimestamp(): Promise<string | null> {
  const activity = await getRecentActivity(1);
  return activity[0]?.timestamp ?? null;
}

/**
 * Pure helper — format an ISO timestamp into a short relative string
 * ("2m ago", "3h ago", "yesterday"). Caller-side so it stays in sync
 * with the user's clock without re-querying the server.
 */
export function formatRelative(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const diffSec = Math.max(0, Math.round((now.getTime() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.round(diffMo / 12)}y ago`;
}
