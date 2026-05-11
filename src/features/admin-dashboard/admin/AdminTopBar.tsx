/**
 * src/features/admin-dashboard/admin/AdminTopBar.tsx
 *
 * Unified admin chrome — appears at the top of every admin page.
 * Contains a history-back button, mode-aware nav links, the signed-in
 * email pill, and a Sign out button.
 *
 * Mobile: nav links collapse to horizontal scroll (overflow-x:auto on the
 * parent container in CSS) — keeps the layout simple without a hamburger.
 */

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
// (NavLink stays — it's still used for the section nav row.)
import { useMode } from '../../../shared/stores/mode';
import { useAuth } from '../../auth/useAuth.helpers';
import { supabase } from '../../../shared/lib/supabase';

type LinkDef = {
  to: string;
  thor: string;
  gear5: string;
  /** When true, NavLink uses end-match (only highlights on exact path). */
  exact?: boolean;
};

/* Round 32: top nav now mirrors the dashboard card list exactly.  Old
   "Content" landing link removed (the 4 content sub-pages each have
   their own direct link); Health renamed to "Ship's Larder" to match
   the card. Same labels, same routes, same order — top bar = dashboard. */
const LINKS: ReadonlyArray<LinkDef> = [
  { to: '/admin',                  thor: 'Dashboard',     gear5: 'Bridge',             exact: true },
  { to: '/admin/projects',         thor: 'Projects',      gear5: 'Wanted Wall' },
  { to: '/admin/content/hero',     thor: 'Hero',     gear5: 'Front Deck Sail' },
  { to: '/admin/content/about',    thor: 'About',    gear5: 'Logbook · About' },
  { to: '/admin/content/skills',   thor: 'Skills',   gear5: 'Crew Drills' },
  { to: '/admin/content/contact',  thor: 'Contact',  gear5: 'Den Den · Greeting' },
  { to: '/admin/messages',         thor: 'Messages',      gear5: 'Den Den Mushi' },
  { to: '/admin/allowlist',        thor: 'Allowlist',     gear5: 'Crew Roster' },
  { to: '/admin/health',           thor: 'Health',        gear5: 'Ship’s Larder' },
  { to: '/admin/account',          thor: 'Account',       gear5: 'Captain’s Badge' },
];

export default function AdminTopBar() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === '/admin';

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — onAuthStateChange will still flip user to null
    }
    // Round 38 — sign-out lands on the public homepage instead of the
    // login page so visitors see the site, not an empty auth screen.
    navigate('/', { replace: true });
  }

  // Round 28: back button now goes directly to /admin (the dashboard) for
  // predictable behaviour. The previous navigate(-1) was ambiguous — it
  // could land on the public site, a stale modal, or even the login page
  // depending on how the user got to the sub-page. With the dashboard now
  // exposing a direct card for every admin route, "Back to Dashboard" is
  // always the right answer. Label is explicit, no longer ambiguous.
  // Hidden on /admin itself (no-op there).

  return (
    <header
      className={[
        'admin-topbar admin-nav',
        isThor ? 'admin-nav--thor' : 'admin-nav--manga',
      ].join(' ')}
      aria-label="Admin chrome"
    >
      {!onDashboard && (
        <button
          type="button"
          className="admin-topbar__back"
          onClick={() => navigate('/admin')}
          aria-label="Back to Dashboard"
          title="Back to Dashboard"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      )}

      <nav
        className="admin-topbar__nav"
        aria-label="Admin sections"
        style={{ overflowX: 'auto' }}
      >
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              [
                'admin-nav__link',
                isActive ? 'admin-nav__link--active' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            {isThor ? link.thor : link.gear5}
          </NavLink>
        ))}
      </nav>

      <div className="admin-topbar__right">
        {user?.email && (
          <span className="admin-topbar__email" title={user.email}>
            {user.email}
          </span>
        )}

        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={handleSignOut}
          style={{ fontSize: '.78rem', padding: '.4rem .75rem' }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
