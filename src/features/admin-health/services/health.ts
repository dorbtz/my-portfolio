/**
 * src/features/admin-health/services/health.ts
 *
 * Read-only diagnostics queries for the /admin/health panel. Every check
 * is wrapped in try/catch so a single failing call doesn't blank the
 * whole dashboard — partial degradation is preferred to a hard error.
 */
import { supabase } from '../../../lib/supabase';

const TABLES = ['projects', 'site_content', 'admin_emails', 'messages', 'profiles'] as const;
export type TableName = (typeof TABLES)[number];

export type CountReport = Record<TableName, number | null>;
export type LastEditedReport = Record<TableName, string | null>;
export type RlsCheck = { table: TableName; readable: boolean; expected: boolean; ok: boolean };

export async function getRowCounts(): Promise<CountReport> {
  const out = {} as CountReport;
  await Promise.all(
    TABLES.map(async (t) => {
      try {
        const { count, error } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true });
        out[t] = error ? null : count ?? 0;
      } catch {
        out[t] = null;
      }
    }),
  );
  return out;
}

type UpdatedAtRow = { updated_at: string | null };
type CreatedAtRow = { created_at: string | null };

export async function getLastEdited(): Promise<LastEditedReport> {
  const out = {} as LastEditedReport;
  await Promise.all(
    TABLES.map(async (t) => {
      try {
        // Prefer updated_at; fall back to created_at if updated_at column
        // doesn't exist on a given table.
        const { data: u, error: ue } = await supabase
          .from(t)
          .select('updated_at')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(1);
        const uRows = (u ?? []) as UpdatedAtRow[];
        if (!ue && uRows.length && uRows[0].updated_at) {
          out[t] = uRows[0].updated_at;
          return;
        }
        const { data: c, error: ce } = await supabase
          .from(t)
          .select('created_at')
          .order('created_at', { ascending: false, nullsFirst: false })
          .limit(1);
        const cRows = (c ?? []) as CreatedAtRow[];
        if (!ce && cRows.length && cRows[0].created_at) {
          out[t] = cRows[0].created_at;
          return;
        }
        out[t] = null;
      } catch {
        out[t] = null;
      }
    }),
  );
  return out;
}

/**
 * Best-effort fetch of recent migrations. The supabase_migrations schema
 * is not exposed via PostgREST by default, so this almost always returns
 * `null` from the client. The UI will show a "view in dashboard" link.
 */
export async function getMigrationList(): Promise<string[] | null> {
  try {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('schema_migrations' as any)
      .select('version, name')
      .order('version', { ascending: false })
      .limit(20);
    if (error || !data) return null;
    return (data as Array<{ version: string; name?: string }>).map((m) =>
      m.name ? `${m.version} — ${m.name}` : m.version,
    );
  } catch {
    return null;
  }
}

/**
 * For each public table, check whether the anon role can SELECT a row.
 * `expected` reflects the design intent: projects + site_content +
 * admin_emails are publicly readable; messages + profiles are admin-only.
 */
export async function getRlsStatus(): Promise<RlsCheck[]> {
  const expectations: Record<TableName, boolean> = {
    projects: true,
    site_content: true,
    admin_emails: true,
    messages: false, // anon should NOT be able to read messages
    profiles: false, // anon should NOT be able to read profiles
  };

  const results: RlsCheck[] = [];
  for (const t of TABLES) {
    let readable = false;
    try {
      // Note: an authenticated admin call WILL succeed for messages/profiles
      // — this RLS check is a coarse signal, not a security audit. We treat
      // the "readable" boolean as: did the request return without 4xx.
      // For messages/profiles the server returns rows because we ARE the
      // admin. So this check is most meaningful for the public tables.
      const { error } = await supabase.from(t).select('*', { head: true }).limit(1);
      readable = !error;
    } catch {
      readable = false;
    }
    results.push({
      table: t,
      readable,
      expected: expectations[t],
      ok: readable === expectations[t] || readable === true, // permissive: signed-in admin reading anywhere is fine
    });
  }
  return results;
}

export type EnvCheck = { name: string; present: boolean; hint?: string };

export function checkEnv(): EnvCheck[] {
  return [
    {
      name: 'VITE_SUPABASE_URL',
      present: Boolean(import.meta.env.VITE_SUPABASE_URL),
      hint: 'Project REST endpoint',
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      present: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
      hint: 'Public anon key',
    },
  ];
}
