/**
 * src/features/admin-messages/admin/MessagesAdmin.tsx
 *
 * Inbox for the contact form. Filters by mode + read state. Click a row
 * to expand and act on it (toggle read, archive, delete).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import { useMode } from '../../../shared/stores/mode';
import { formatRelative } from '../../admin-dashboard/services/dashboardStats';
import {
  deleteMessage,
  listMessages,
  setArchived,
  snippet,
  toggleRead,
  type MessageFilter,
  type MessageRow,
} from '../services/messages';
import '../../admin-dashboard/styles/admin-dashboard.css';

/**
 * Open Gmail's compose URL in a popup window, pre-filled with the
 * recipient's address + subject line. Uses the standard `?view=cm&fs=1`
 * Gmail compose endpoint so it works whether the admin is signed into
 * one Gmail account or many (the account chooser appears as needed).
 *
 * If the popup is blocked, falls back to opening in a new tab.
 */
function openGmailCompose(to: string, subject: string): void {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    to,
  )}&su=${encodeURIComponent(subject)}`;
  const features = 'width=720,height=720,scrollbars=yes,resizable=yes';
  const popup = window.open(url, 'gmail-compose', features);
  if (!popup) {
    // Popup blocked — fall back to a regular tab open
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

const FILTERS: ReadonlyArray<{ id: MessageFilter; thor: string; gear5: string }> = [
  { id: 'all',      thor: 'All',      gear5: 'All' },
  { id: 'unread',   thor: 'Unread',   gear5: 'Unread' },
  { id: 'archived', thor: 'Archived', gear5: 'Archived' },
  { id: 'thor',     thor: 'From Thor mode',  gear5: 'From Thor mode' },
  { id: 'gear5',    thor: 'From Gear 5',     gear5: 'From Gear 5' },
];

export default function MessagesAdmin() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (f: MessageFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMessages(f);
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const counts = useMemo(() => {
    const unread = rows.filter((r) => !r.read_at && !r.archived).length;
    return { total: rows.length, unread };
  }, [rows]);

  async function handleToggleRead(row: MessageRow) {
    setBusyId(row.id);
    try {
      await toggleRead(row);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, read_at: r.read_at ? null : new Date().toISOString() }
            : r,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(row: MessageRow) {
    setBusyId(row.id);
    try {
      await setArchived(row.id, !row.archived);
      // Drop from current view if filter no longer matches.
      setRows((prev) =>
        prev
          .map((r) => (r.id === row.id ? { ...r, archived: !r.archived } : r))
          .filter((r) => {
            if (filter === 'archived') return r.archived;
            if (filter === 'unread') return !r.read_at && !r.archived;
            if (filter === 'all') return true;
            return r.mode === filter;
          }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(row: MessageRow) {
    const confirmed = window.confirm(
      `Permanently delete the message from ${row.name} (${row.email})?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;
    setBusyId(row.id);
    try {
      await deleteMessage(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (expandedId === row.id) setExpandedId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
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
            {isThor ? '// MESSAGES' : 'DEN DEN MUSHI'}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="messages" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
            >
              {isThor ? 'Inbox' : 'Snail line'}
            </h1>
          </div>
          <p className="mt-1 text-sm opacity-70">
            {counts.unread} unread · {counts.total} shown
          </p>
        </header>

        <div className="admin-msg-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={[
                'admin-btn',
                filter === f.id ? 'admin-cta' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setFilter(f.id);
                setExpandedId(null);
              }}
              style={{ fontSize: '.78rem', padding: '.4rem .75rem' }}
              aria-pressed={filter === f.id}
            >
              {isThor ? f.thor : f.gear5}
            </button>
          ))}
          <button
            type="button"
            className="admin-btn"
            onClick={() => load(filter)}
            disabled={loading}
            style={{ fontSize: '.78rem', padding: '.4rem .75rem', marginLeft: 'auto' }}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <p className="admin-card__error mb-3" role="alert">
            {error}
          </p>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-sm opacity-65" role="status">
            {isThor
              ? 'No messages match this filter.'
              : 'No snail calls in this view.'}
          </p>
        )}

        <ul className="admin-msg-list">
          {rows.map((row) => {
            const isExpanded = expandedId === row.id;
            const isUnread = !row.read_at && !row.archived;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className={[
                    'admin-msg-row',
                    isUnread ? 'admin-msg-row--unread' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  <span className="admin-msg-row__name">{row.name}</span>
                  <span className="admin-msg-row__snippet">
                    {snippet(row.message)}
                  </span>
                  {row.mode && (
                    <span className="admin-msg-badge">{row.mode}</span>
                  )}
                  <span className="admin-msg-row__meta">
                    {isUnread && <span aria-hidden="true">●</span>}
                    {formatRelative(row.created_at)}
                  </span>
                </button>

                {isExpanded && (
                  <div className="admin-msg-row__expanded">
                    <div className="text-xs opacity-70">
                      <a
                        href={`mailto:${row.email}`}
                        style={{ textDecoration: 'underline' }}
                      >
                        {row.email}
                      </a>
                      {' · '}
                      {new Date(row.created_at).toLocaleString()}
                      {row.archived && (
                        <span> · <em>archived</em></span>
                      )}
                    </div>
                    <p>{row.message}</p>
                    <div className="admin-msg-actions">
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={busyId === row.id}
                        onClick={() => handleToggleRead(row)}
                      >
                        {row.read_at ? 'Mark unread' : 'Mark read'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={busyId === row.id}
                        onClick={() => handleArchive(row)}
                      >
                        {row.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => openGmailCompose(row.email, `Re: your message`)}
                        title="Opens Gmail compose in a popup, pre-filled with the recipient + subject"
                      >
                        Reply via Gmail ↗
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={busyId === row.id}
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
