/**
 * src/features/content/admin/ContentLanding.tsx
 *
 * The /admin/content index — five cards linking to each section editor.
 */

import { Link } from 'react-router-dom';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import '../../admin-dashboard/styles/admin-dashboard.css';
import { useMode } from '../../../shared/stores/mode';
import { useSiteContentStore } from '../stores/siteContentStore';

const CARDS = [
  {
    to: '/admin/content/hero',
    title: 'Hero',
    description:
      'Rotating titles, body paragraph, CTA labels, stat tiles, mode toggle copy.',
    icon: '⚡',
  },
  {
    to: '/admin/content/about',
    title: 'About',
    description:
      'All five comic panels — kickers, captions, body paragraphs, SFX bursts.',
    icon: '📓',
  },
  {
    to: '/admin/content/skills',
    title: 'Skills',
    description:
      'Yggdrasil + Grand Line domains, future realms, lore lines.',
    icon: '🌳',
  },
  {
    to: '/admin/content/projects-copy',
    title: 'Projects copy',
    description:
      'Search placeholder, focus chips, empty-state copy. (NOT the project list itself.)',
    icon: '📜',
  },
  {
    to: '/admin/content/contact',
    title: 'Contact',
    description:
      'Form labels, eyebrow, CTA, success/sending text, model captions.',
    icon: '☎️',
  },
  {
    to: '/admin/content/admin-entry',
    title: 'Admin entry',
    description:
      'Configure the hidden click-sequence on the header wordmark that opens the admin login.',
    icon: '🔑',
  },
] as const;

export default function ContentLanding() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const status = useSiteContentStore((s) => s.status);
  const error = useSiteContentStore((s) => s.error);

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
            {isThor ? '// CONTENT HUB' : "CAPTAIN'S LOG"}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="content" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0 }}
            >
              Site copy editor
            </h1>
          </div>
          <p className="mt-1 text-sm opacity-70 max-w-prose">
            Edit visible text on every public section without redeploying. Each
            section has independent Thor and Gear 5 drafts, except Skills which
            is unified across modes. Saves apply within seconds via Supabase.
          </p>
          {status === 'loading' && (
            <p className="mt-2 text-xs opacity-60">Loading current copy…</p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-xs text-rose-300/80" role="alert">
              Could not load copy from the server. Showing in-code defaults
              instead. Editing still works once the site reconnects.{' '}
              {error ? <span className="opacity-70">({error})</span> : null}
            </p>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="admin-card admin-card--inline p-4 md:p-5 hover:opacity-95 transition"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl">
                  {card.icon}
                </span>
                <div>
                  <h2 className="admin-card__heading" style={{ marginBottom: 6 }}>
                    {card.title}
                  </h2>
                  <p className="text-sm opacity-75">{card.description}</p>
                </div>
              </div>
              <div className="mt-3 text-xs opacity-60">
                Open editor →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
