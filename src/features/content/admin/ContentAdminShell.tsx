/**
 * src/features/content/admin/ContentAdminShell.tsx
 *
 * Shared chrome for every admin/content page. Renders:
 *   - The .admin-shell theme wrapper (Thor / Manga)
 *   - The AdminNav
 *   - A page-level header (eyebrow + title)
 *   - The two-column Thor + Luffy slot
 *
 * Children render their own form columns; this component only owns the
 * layout + theming.
 */

import type { ReactNode } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import '../../admin-dashboard/styles/admin-dashboard.css';
import { useMode } from '../../../shared/stores/mode';

/** Section names accepted by ContentAdminShell — these mirror the
    sub-page icon mappings exposed by AdminPageIcon (Round 28). */
type ContentSection =
  | 'content'
  | 'content-hero'
  | 'content-about'
  | 'content-skills'
  | 'content-projects'
  | 'content-contact'
  // Round 64 — Phase B of the hidden D-B-T admin entry.
  | 'content-admin';

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Round 28: per-page icon override. Defaults to 'content' for the
      landing page; sub-pages pass their own (`'content-hero'`, etc.) so
      the page header icon matches the dashboard card. */
  section?: ContentSection;
  /** Left column — the Thor-mode editor. (Two-column layout.) */
  thorPanel?: ReactNode;
  /** Right column — the Luffy-mode editor. (Two-column layout.) */
  gear5Panel?: ReactNode;
  /** Round 29 single-pane layout. When provided, renders ONE full-width
      panel under the header instead of the two-column Thor + Gear 5 grid.
      Used by the rebuilt live-preview admin pages where the per-mode
      switch is handled by `<ModeTabs>` inside the panel. */
  children?: ReactNode;
  /** Optional toast / feedback strip rendered above the columns. */
  feedback?: ReactNode;
};

export default function ContentAdminShell({
  eyebrow,
  title,
  description,
  section = 'content',
  thorPanel,
  gear5Panel,
  children,
  feedback,
}: Props) {
  const mode = useMode();
  const isThor = mode === 'thor';
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
        <header className="admin-page-header mb-6">
          <p className="admin-card__eyebrow" style={{ marginBottom: '0.15rem' }}>
            {eyebrow}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section={section} />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
            >
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1 text-sm opacity-70 max-w-prose">{description}</p>
          )}
        </header>

        {feedback && <div className="mb-4">{feedback}</div>}

        {children ? (
          <div className="admin-card admin-card--inline admin-card--bare">{children}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className="admin-card admin-card--inline p-4 md:p-6"
              data-content-pane="thor"
            >
              <h2 className="admin-card__heading">Thor mode</h2>
              <p className="mt-0.5 text-xs opacity-70">
                Cinematic Asgardian copy.
              </p>
              <div className="mt-4 grid gap-4">{thorPanel}</div>
            </section>
            <section
              className="admin-card admin-card--inline p-4 md:p-6"
              data-content-pane="gear5"
            >
              <h2 className="admin-card__heading">Gear 5 mode</h2>
              <p className="mt-0.5 text-xs opacity-70">
                Manga-paneled Luffy copy.
              </p>
              <div className="mt-4 grid gap-4">{gear5Panel}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
