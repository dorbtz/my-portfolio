/**
 * src/features/admin-health/admin/HealthAdmin.tsx
 *
 * Read-only diagnostics. Auto-refreshes every 30s. All checks are
 * non-blocking — a single failing query does not blank the page.
 */

import { useCallback, useEffect, useState } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import { useMode } from '../../../stores/mode';
import { formatRelative } from '../../admin-dashboard/services/dashboardStats';
import {
  checkEnv,
  getLastEdited,
  getMigrationList,
  getRlsStatus,
  getRowCounts,
  type CountReport,
  type EnvCheck,
  type LastEditedReport,
  type RlsCheck,
} from '../services/health';
// MCP catalog merged in (Round 33): MCP page deleted, its inspector now
// renders as a section inside this page so admins have a single Health +
// integrations panel instead of two near-duplicate routes.
import { MCP_CATALOG, type McpStatus } from '../../admin-mcp/mcpCatalog';
import '../../admin-dashboard/styles/admin-dashboard.css';

const SUPABASE_PROJECT_REF = 'cntfovazycoilrxqkquy';

type Tone = 'green' | 'yellow' | 'red';

function Dot({ tone }: { tone: Tone }) {
  return <span className={`admin-health-dot admin-health-dot--${tone}`} aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// MCP status pill — moved here from the (deleted) McpAdmin page.
// ---------------------------------------------------------------------------
const PILL_COLORS: Record<McpStatus, string> = {
  pending: '#888',
  ok: '#28a745',
  degraded: '#f1c40f',
  down: '#d11b1b',
};
const PILL_LABELS: Record<McpStatus, string> = {
  pending: 'Checking…',
  ok: 'Online',
  degraded: 'Slow',
  down: 'Offline',
};
function StatusPill({ status }: { status: McpStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.18rem 0.6rem',
        borderRadius: 4,
        fontSize: '0.72rem',
        background: PILL_COLORS[status],
        color: '#fff',
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {status === 'ok' ? '●' : status === 'down' ? '○' : status === 'degraded' ? '◐' : '⋯'}{' '}
      {PILL_LABELS[status]}
    </span>
  );
}

export default function HealthAdmin() {
  const mode = useMode();
  const isThor = mode === 'thor';

  const [counts, setCounts] = useState<CountReport | null>(null);
  const [edits, setEdits] = useState<LastEditedReport | null>(null);
  const [migrations, setMigrations] = useState<string[] | null>(null);
  const [rls, setRls] = useState<RlsCheck[]>([]);
  const [env, setEnv] = useState<EnvCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  // MCP server statuses — pinged once on mount via the catalog's checkStatus
  // hooks. Catalog entries without a checkStatus default to 'ok'.
  const [mcpStatuses, setMcpStatuses] = useState<Record<string, McpStatus>>(() =>
    Object.fromEntries(MCP_CATALOG.map((s) => [s.id, 'pending'])),
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const [c, e, m, r] = await Promise.all([
      getRowCounts(),
      getLastEdited(),
      getMigrationList(),
      getRlsStatus(),
    ]);
    setCounts(c);
    setEdits(e);
    setMigrations(m);
    setRls(r);
    setEnv(checkEnv());
    setLastRunAt(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  // Probe MCP servers once on mount (each call is independent of refresh()).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      MCP_CATALOG.map(async (server) => {
        if (!server.checkStatus) return [server.id, 'ok' as McpStatus] as const;
        const result = await server.checkStatus();
        return [server.id, result] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setMcpStatuses((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const envOk = env.every((e) => e.present);
  const rlsOk = rls.every((r) => r.ok);

  return (
    <div
      className={[
        'admin-shell admin-shell--projects',
        isThor ? 'admin-shell--thor' : 'admin-shell--manga',
      ].join(' ')}
      data-mode-target={mode}
    >
      <div className="admin-page w-full py-6">
        <AdminTopBar />

        <header className="admin-page-header mb-4">
          <p className="admin-card__eyebrow" style={{ marginBottom: '0.15rem' }}>
            {isThor ? '// HEALTH' : "SHIP'S LARDER"}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="health" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
            >
              {isThor ? 'System health' : 'Log Pose Field Reading'}
            </h1>
          </div>
          <p className="mt-1 text-sm opacity-70">
            Auto-refreshes every 30s. Last check {formatRelative(lastRunAt) || 'just now'}.
            <button
              type="button"
              className="admin-btn ml-3"
              onClick={refresh}
              disabled={loading}
              style={{ fontSize: '.72rem', padding: '.3rem .6rem' }}
            >
              {loading ? 'Checking…' : '↻ Recheck'}
            </button>
          </p>
        </header>

        {/* Gap between the recheck control and the diagnostic cards */}
        <div style={{ height: '1.25rem' }} />

        <div className="admin-health-grid">
          {/* Env */}
          <article className="admin-health-card">
            <h2 className="admin-health-card__title">
              <Dot tone={envOk ? 'green' : 'red'} />
              Environment
            </h2>
            <div className="admin-health-card__body">
              <ul>
                {env.map((e) => (
                  <li key={e.name}>
                    {e.present ? '✓' : '✗'} <code>{e.name}</code>
                    {e.hint && <span className="opacity-65"> — {e.hint}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Row counts */}
          <article className="admin-health-card">
            <h2 className="admin-health-card__title">
              <Dot tone={counts ? 'green' : 'yellow'} />
              Row counts
            </h2>
            <div className="admin-health-card__body">
              {!counts && <p className="opacity-65">Loading…</p>}
              {counts && (
                <ul>
                  {Object.entries(counts).map(([table, n]) => (
                    <li key={table}>
                      <code>{table}</code>: {n === null ? <em>n/a</em> : n}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          {/* Last edited */}
          <article className="admin-health-card">
            <h2 className="admin-health-card__title">
              <Dot tone={edits ? 'green' : 'yellow'} />
              Last edits
            </h2>
            <div className="admin-health-card__body">
              {!edits && <p className="opacity-65">Loading…</p>}
              {edits && (
                <ul>
                  {Object.entries(edits).map(([table, ts]) => (
                    <li key={table}>
                      <code>{table}</code>: {formatRelative(ts) || '—'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          {/* RLS */}
          <article className="admin-health-card">
            <h2 className="admin-health-card__title">
              <Dot tone={rls.length === 0 ? 'yellow' : rlsOk ? 'green' : 'yellow'} />
              RLS reachability
            </h2>
            <div className="admin-health-card__body">
              {rls.length === 0 && <p className="opacity-65">Loading…</p>}
              {rls.length > 0 && (
                <>
                  <p className="opacity-65 mb-1" style={{ fontSize: '.72rem' }}>
                    Coarse check: did SELECT respond. Run from your admin
                    session, so admin-only tables (messages, profiles) will
                    succeed here. Public tables (projects, site_content) must
                    succeed for anon visitors.
                  </p>
                  <ul>
                    {rls.map((r) => (
                      <li key={r.table}>
                        {r.readable ? '✓' : '✗'} <code>{r.table}</code>{' '}
                        <span className="opacity-65">
                          (expected anon-readable: {r.expected ? 'yes' : 'no'})
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </article>

          {/* Migrations */}
          <article className="admin-health-card">
            <h2 className="admin-health-card__title">
              <Dot tone={migrations ? 'green' : 'yellow'} />
              Migrations
            </h2>
            <div className="admin-health-card__body">
              {migrations === null && (
                <p className="opacity-75">
                  Migration history is not exposed via PostgREST.{' '}
                  <a
                    href={`https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/database/migrations`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    View in Supabase dashboard ↗
                  </a>
                </p>
              )}
              {migrations && migrations.length > 0 && (
                <ul>
                  {migrations.slice(0, 8).map((m) => (
                    <li key={m}>
                      <code>{m}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>

        {/* ------------------------------------------------------------------
         * MCP servers — merged here from the deleted /admin/mcp page so admins
         * have one combined "ship integrations" view instead of two routes.
         * ------------------------------------------------------------------ */}
        <h2
          className="admin-card__heading mt-8 mb-3"
          style={{ fontSize: '1rem' }}
        >
          {isThor ? 'MCP servers' : 'Den Den Web — connected snail lines'}
        </h2>
        <div className="admin-mcp-grid">
          {MCP_CATALOG.map((server) => {
            const status = mcpStatuses[server.id] ?? 'pending';
            return (
              <article
                key={server.id}
                className="dossier-card"
                data-open="true"
                style={{ marginBottom: '1rem' }}
              >
                <div
                  className="dossier-card__header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <h3 className="dossier-card__title">
                    {isThor ? server.label.thor : server.label.gear5}
                  </h3>
                  <StatusPill status={status} />
                </div>
                <div className="dossier-card__body">
                  <p>
                    <strong>{isThor ? 'Category' : 'Role'}:</strong> {server.category}
                  </p>
                  <p>
                    <strong>{isThor ? 'Purpose' : 'Job'}:</strong> {server.purpose}
                  </p>
                  {server.publicProjectRef && (
                    <p>
                      <strong>{isThor ? 'Project ref' : 'Snail ID'}:</strong>{' '}
                      <code>{server.publicProjectRef}</code>
                    </p>
                  )}
                  <p>
                    <a
                      href={server.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {isThor ? 'Docs ↗' : 'Open scrolls ↗'}
                    </a>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
