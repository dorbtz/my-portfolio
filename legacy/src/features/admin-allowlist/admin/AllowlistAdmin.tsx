/**
 * src/features/admin-allowlist/admin/AllowlistAdmin.tsx
 *
 * Manage the public.admin_emails roster. Add a new admin (form with
 * regex validation), remove an existing one (confirm dialog).
 *
 * Self-lockout protection: if the user is the only admin AND tries to
 * remove their own email, the action is blocked client-side. The server
 * still gates writes via is_admin() — but a friendly UI guard is much
 * nicer than a 403.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import { useMode } from '../../../shared/stores/mode';
import { useAuth } from '../../auth/useAuth.helpers';
import { AdminField, AdminInput } from '../../admin-dashboard/admin/AdminField';
import {
  addAdmin,
  isValidEmail,
  listAdmins,
  removeAdmin,
  type AdminEmailRow,
} from '../services/allowlist';
import '../../admin-dashboard/styles/admin-dashboard.css';

export default function AllowlistAdmin() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const { user } = useAuth();
  const myEmail = (user?.email ?? '').trim().toLowerCase();

  const [rows, setRows] = useState<AdminEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdmins();
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const draftValid = useMemo(() => isValidEmail(draft), [draft]);
  const draftDuplicate = useMemo(
    () => rows.some((r) => r.email.toLowerCase() === draft.trim().toLowerCase()),
    [rows, draft],
  );

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!draftValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (draftDuplicate) {
      setError('That email is already on the allowlist.');
      return;
    }
    setAdding(true);
    try {
      await addAdmin(draft);
      setInfo(`Added ${draft.trim().toLowerCase()} to the allowlist.`);
      setDraft('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(email: string) {
    setError(null);
    setInfo(null);
    const isSelf = email.toLowerCase() === myEmail;
    if (isSelf && rows.length <= 1) {
      setError(
        'You are the only admin — removing yourself would lock everyone out. Add another admin first.',
      );
      return;
    }
    const confirmed = window.confirm(
      isSelf
        ? `Remove YOUR OWN email (${email}) from the admin allowlist?\n\nYou will lose access immediately on your next session refresh.`
        : `Remove ${email} from the admin allowlist?`,
    );
    if (!confirmed) return;
    setBusyEmail(email);
    try {
      await removeAdmin(email);
      setInfo(`Removed ${email}.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyEmail(null);
    }
  }

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
            {isThor ? '// ALLOWLIST' : 'CREW ROSTER'}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="allowlist" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
            >
              {isThor ? 'Admin allowlist' : 'Bridge crew'}
            </h1>
          </div>
          <p className="mt-1 text-sm opacity-70 max-w-prose">
            {isThor
              ? 'Email addresses listed here can request a magic-link sign-in to the admin panel. Server-side RLS enforces this — UI changes apply within seconds.'
              : 'Only nakama on this list can climb the rigging to the bridge. Adds and removals take effect right away.'}
          </p>
        </header>

        <section
          className="admin-card admin-card--inline admin-card--bare mb-5"
          aria-label="Add admin"
        >
          <h2 className="admin-card__heading mb-3">
            {isThor ? '+ Add admin' : '+ Add nakama'}
          </h2>
          <form
            onSubmit={handleAdd}
            className="grid gap-3"
            style={{ gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'end' }}
          >
            <AdminField label="Email" htmlFor="allowlist-new-email">
              <AdminInput
                id="allowlist-new-email"
                type="email"
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
                placeholder="newadmin@example.com"
                autoComplete="off"
                disabled={adding}
                required
              />
            </AdminField>
            <button
              type="submit"
              className="admin-cta admin-cta--primary"
              disabled={adding || !draftValid || draftDuplicate}
              style={{ padding: '.6rem 1rem' }}
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>
          {draft && !draftValid && (
            <p className="mt-2 text-xs text-rose-300/80" role="alert">
              That doesn’t look like a valid email.
            </p>
          )}
          {draft && draftValid && draftDuplicate && (
            <p className="mt-2 text-xs opacity-70">Already on the list.</p>
          )}
        </section>

        {error && (
          <p className="admin-card__error mb-3" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="admin-card__success mb-3" role="status">
            {info}
          </p>
        )}

        <section
          className="admin-card admin-card--inline admin-card--bare"
          aria-label="Current admins"
        >
          <h2 className="admin-card__heading mb-3">
            {isThor ? `Allowlisted (${rows.length})` : `On the roster (${rows.length})`}
          </h2>
          <p className="text-xs opacity-70 mb-3 max-w-prose">
            {isThor
              ? 'New admins receive a magic-link sign-in. After their first login, they should set a password + username via the Account page so they can sign in directly without waiting for an email.'
              : 'Fresh nakama get a snail-call magic link first. After they board, send them to the Captain’s badge to set a sea code + handle for quicker boarding next time.'}
          </p>
          {loading && <p className="text-sm opacity-65">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="text-sm opacity-65">
              No admins yet. (You should not be seeing this — your own email
              must already be in the allowlist for this page to load.)
            </p>
          )}
          <ul className="grid gap-2">
            {rows.map((row) => {
              const isSelf = row.email.toLowerCase() === myEmail;
              const history = Array.isArray(row.previous_emails) ? row.previous_emails : [];
              return (
                <li key={row.email} className="admin-allow-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', width: '100%' }}>
                    <span className="admin-allow-row__email">
                      {row.email}
                      {isSelf && (
                        <span className="ml-2 text-xs opacity-65">(you)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      disabled={busyEmail === row.email}
                      onClick={() => handleRemove(row.email)}
                      style={{ fontSize: '.78rem', padding: '.4rem .75rem' }}
                    >
                      {busyEmail === row.email ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                  {history.length > 0 && (
                    <p className="text-xs opacity-65" style={{ marginTop: '.4rem', lineHeight: 1.5 }}>
                      {isThor ? 'Previously: ' : 'Was: '}
                      {history.map((prev, i) => (
                        <span key={prev}>
                          <code style={{ fontSize: '.72rem' }}>{prev}</code>
                          {i < history.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
