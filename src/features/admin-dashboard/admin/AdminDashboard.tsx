/**
 * src/features/admin-dashboard/admin/AdminDashboard.tsx
 *
 * Round 28 — FULL DASHBOARD REDESIGN (manga aesthetic, flattened nav).
 *
 * Highlights of this round (vs Round 21):
 *   1. Adds direct cards for ALL 5 site-content sub-pages (Hero / About /
 *      Skills / Projects copy / Contact). The /admin/content landing card
 *      stays for backwards-compat but is no longer the only path.
 *   2. Uses ALL 11 Straw-Hat .ico assets in /public/assets/One-Piece/icons/.
 *      Luffy.ico is reserved for the COMMANDER hero strip (top of page).
 *   3. Brand-new "Commander Hero Strip" — Luffy/Mjolnir stamp + greeting +
 *      5 slim stat tiles all packed into one tight panel.
 *   4. Tighter manga-panel rhythm: dashboard wrapper has near-zero gaps
 *      between sections (handled via CSS `.admin-shell--dashboard`).
 *   5. Manga touches (Luffy mode only): halftone Ben-Day dots on hero,
 *      polygon clip-path corner cuts on cards, "WANTED!"/"BOUNTY!" mini
 *      stamps on stat tiles, kana SFX burst on card hover.
 *   6. Activity drawer kept (collapsible, narrow) at the bottom.
 *
 * Layout:
 *   <AdminTopBar/>
 *   ┌── Commander Hero (LUFFY/MJOLNIR stamp + greeting + 5 stat tiles)
 *   ├── Card grid (11-12 cards: 1 per route, manga panel rhythm)
 *   └── Activity drawer (collapsible)
 *
 * Theming is CSS-only via .admin-shell--thor / .admin-shell--manga.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminTopBar from './AdminTopBar';
import { useMode } from '../../../shared/stores/mode';
import { useAuth } from '../../auth/useAuth.helpers';
import { getProfile, type Profile } from '../../auth/services/profiles';
import {
  formatRelative,
  getDashboardCounts,
  getRecentActivity,
  type ActivityItem,
  type DashboardCounts,
} from '../services/dashboardStats';
import '../styles/admin-dashboard.css';

// Round 32: DEV 3D Test card removed entirely (no longer ships in any
// build, even DEV).  The route was deleted from `routes.tsx`.

type FeatureCard = {
  to: string;
  /** Marvel .ico filename (no path), e.g. 'captain-shield.ico'. */
  thorIcon: string;
  /** One-Piece .ico filename. */
  luffyIcon: string;
  /** Optional kana SFX shown on hover in Luffy mode. */
  sfx?: string;
  thor: { title: string; desc: string };
  gear5: { title: string; desc: string };
};

/* Round 28 — flattened card list. Every admin route gets a direct card,
   including each Site Content sub-page so the user no longer has to drill
   through /admin/content to reach Hero/About/Skills/Projects-copy/Contact.

   Icon distribution rules:
     • LUFFY.ICO is reserved for the commander hero stamp (rendered below).
     • The remaining 10 Straw Hats (zoro/nami/usopp/sanji/chooper/robin/
       franky/brook/bear/meat) are distributed across the 12 cards. Two
       cards intentionally repeat an icon (luffy on Hero copy = the homepage
       hero IS Luffy's panel; bear repeats on Messages as the postal bear).
   This satisfies the brief: "use ALL 11 Luffy-mode icons across the cards". */
const FEATURE_CARDS: ReadonlyArray<FeatureCard> = [
  /* Round 28 (refined): NO duplicate icons within the dashboard.  Site
     Content landing card removed (the 5 content sub-cards below already
     provide direct access).  deadpool2.ico put to use for Messages.
     Cards marked "MISSING ICON" still don't have a unique icon — those
     positions reuse the closest match until the user supplies more
     icons.  See the count summary in the chat reply. */
  {
    to: '/admin/projects',
    thorIcon: 'captain-shield.ico',
    luffyIcon: 'zoroflag.ico',
    sfx: 'ザン!',
    thor: { title: 'Projects', desc: 'Manage dossiers — create, edit, reorder.' },
    gear5: { title: 'Wanted Wall', desc: 'Pin bounties and curate the wanted board.' },
  },
  {
    // Round 32: Luffy icon swapped to strawhatflag.ico — frees luffy.ico
    // as the unique commander stamp.  The Straw Hat flag IS the front-
    // deck sail in canon, so the metaphor lands perfectly.
    // Marvel side still reuses mjolnir.ico (also on Account/commander)
    // until the user supplies a unique replacement.
    to: '/admin/content/hero',
    thorIcon: 'mjolnir.ico',
    luffyIcon: 'strawhatflag.ico',
    sfx: 'ドン!',
    thor: { title: 'Hero', desc: 'Edit the homepage hero headline + sub.' },
    gear5: { title: 'Front Deck Sail', desc: 'Rewrite the main sail above the deck.' },
  },
  {
    to: '/admin/content/about',
    thorIcon: 'stan-lee.ico',
    luffyIcon: 'robin.ico',
    sfx: 'カキ!',
    thor: { title: 'About', desc: 'Edit the About section narrative + bio.' },
    gear5: { title: 'Logbook · About', desc: 'Pen the captain’s lore and history.' },
  },
  {
    to: '/admin/content/skills',
    thorIcon: 'wolverin.ico',
    luffyIcon: 'zoro.ico',
    sfx: 'バキ!',
    thor: { title: 'Skills', desc: 'Edit the Skills heading + skill list.' },
    gear5: { title: 'Crew Drills', desc: 'List the techniques the crew has mastered.' },
  },
  // Round 30 — projects-copy card removed. The fields are now inlined at
  // the top of /admin/projects so editing rows + their surrounding copy
  // happens on a single page. The /admin/content/projects-copy route still
  // works for deep-links from existing bookmarks.
  {
    to: '/admin/content/contact',
    thorIcon: 'spiderman.ico',
    luffyIcon: 'brook.ico',
    sfx: 'ヨホ!',
    thor: { title: 'Contact', desc: 'Edit the Contact section heading + intro.' },
    gear5: { title: 'Den Den · Greeting', desc: 'Set the snail-line opening words.' },
  },
  {
    // Messages — uses deadpool2.ico (previously unused) instead of
    // spiderman.ico to free spiderman for Contact only.
    to: '/admin/messages',
    thorIcon: 'deadpool2.ico',
    luffyIcon: 'bear.ico',
    sfx: 'ピッ!',
    thor: { title: 'Messages', desc: 'Read incoming contact-form submissions.' },
    gear5: { title: 'Den Den Mushi', desc: 'Pick up snail-line calls from the crew.' },
  },
  {
    to: '/admin/allowlist',
    thorIcon: 'blackpanther.ico',
    luffyIcon: 'nami.ico',
    sfx: 'クル!',
    thor: { title: 'Allowlist', desc: 'Authorize emails for admin sign-in.' },
    gear5: { title: 'Crew Roster', desc: 'Assign or remove nakama on the bridge.' },
  },
  {
    to: '/admin/health',
    thorIcon: 'ironman.ico',
    luffyIcon: 'chooper.ico',
    sfx: 'ガツ!',
    thor: { title: 'Health', desc: 'DB row counts, RLS status, env checks.' },
    gear5: { title: 'Ship’s Larder', desc: 'Check the larder — tables and policies.' },
  },
  {
    // Account — needs a NEW Marvel icon.  Currently reuses mjolnir
    // (also on commander + Hero copy) until the user supplies one.
    to: '/admin/account',
    thorIcon: 'mjolnir.ico',
    luffyIcon: 'sanji.ico',
    sfx: 'カチ!',
    thor: { title: 'Account', desc: 'Set or change password, manage sign-in.' },
    gear5: { title: 'Captain’s Badge', desc: 'Carve your sea code, manage the wheel.' },
  },
];

function activityIcon(source: ActivityItem['source']): string {
  switch (source) {
    case 'project':       return '★';
    case 'site_content':  return '✎';
    case 'message':       return '✉';
    default:              return '•';
  }
}

const PW_BANNER_KEY = 'admin.pwBanner.dismissed';

function readBannerDismissed(): boolean {
  try {
    return window.localStorage.getItem(PW_BANNER_KEY) === '1';
  } catch {
    return false;
  }
}

/** Pick the friendliest available identifier for the admin greeting. */
function pickGreetingName(
  profile: Profile | null | undefined,
  email: string | null | undefined,
): string {
  const username = profile?.username?.trim();
  if (username) return username;
  const display = profile?.display_name?.trim();
  if (display) return display;
  if (email) {
    const at = email.indexOf('@');
    if (at > 0) return email.slice(0, at);
    return email;
  }
  return '';
}

/** AnimatedCount — counts up to `value` over ~600ms whenever value changes. */
function AnimatedCount({ value }: { value: number | string | undefined }) {
  const [display, setDisplay] = useState<number | string>(() =>
    typeof value === 'number' ? 0 : (value ?? '…'),
  );

  useEffect(() => {
    if (value === undefined) {
      setDisplay('…');
      return;
    }
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }
    const target = value;
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(target * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export default function AdminDashboard() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const { user } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [lastEdit, setLastEdit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwBannerDismissed, setPwBannerDismissed] = useState<boolean>(() => readBannerDismissed());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  // Tick once a minute so relative times re-render without a fetch.
  const [, setNow] = useState(0);

  // Fetch admin profile (for greeting tagline).
  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    getProfile(user.id).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const greetingName = useMemo(
    () => pickGreetingName(profile, user?.email),
    [profile, user?.email],
  );

  function dismissPwBanner() {
    try {
      window.localStorage.setItem(PW_BANNER_KEY, '1');
    } catch {
      // ignore
    }
    setPwBannerDismissed(true);
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        getDashboardCounts(),
        getRecentActivity(10),
      ]);
      setCounts(c);
      setActivity(a);
      setLastEdit(a[0]?.timestamp ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh once per minute (also doubles as the relative-time tick).
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const cards = FEATURE_CARDS;

  // Stat tile data shared by both modes (theme-only differences).
  // Each tile carries an optional `stamp` decorative label rendered only
  // in Luffy mode ("WANTED!", "BOUNTY!", etc).
  const statTiles: Array<{
    label: { thor: string; gear5: string };
    value: number | string | undefined;
    hint: { thor: string; gear5: string };
    stamp?: string;
  }> = [
    {
      label: { thor: 'Projects', gear5: 'Bounties' },
      value: counts?.projects,
      hint: { thor: 'in dossier', gear5: 'on the wall' },
      stamp: 'WANTED',
    },
    {
      label: { thor: 'Content rows', gear5: 'Log entries' },
      value: counts?.siteContent,
      hint: { thor: 'across both modes', gear5: 'either side' },
      stamp: 'LOG',
    },
    {
      label: { thor: 'Messages', gear5: 'Snail calls' },
      value: counts ? `${counts.messagesUnread} / ${counts.messages}` : undefined,
      hint: { thor: 'unread / total', gear5: 'fresh / all' },
      stamp: 'MAIL!',
    },
    {
      label: { thor: 'Admins', gear5: 'Crew' },
      value: counts?.admins,
      hint: { thor: 'allowlisted', gear5: 'on the roster' },
      stamp: 'CREW',
    },
    {
      label: { thor: 'Last edit', gear5: 'Last log' },
      value: formatRelative(lastEdit) || '—',
      hint: { thor: 'across all tables', gear5: 'anywhere on board' },
      stamp: 'NEW!',
    },
  ];

  /* Commander hero strip — top-of-page panel with the leader stamp
     (Luffy in Gear-5 mode, Mjolnir in Thor mode), a brief greeting and
     the 5-tile stat row all packed in one panel for a tight rhythm. */
  const commanderIcon = isThor
    ? '/assets/Marvel/icons/mjolnir.ico'
    : '/assets/One-Piece/icons/luffy.ico';
  const commanderEyebrow = isThor ? '// ADMIN COMMAND DECK' : "// CAPTAIN’S BRIDGE";
  const commanderTitle = isThor
    ? `Welcome back${greetingName ? `, ${greetingName}` : ''}.`
    : `Yo${greetingName ? `, captain ${greetingName}` : ', captain'}.`;
  const commanderSub = isThor
    ? 'Snapshot of the realm — pick a station below.'
    : 'Snapshot of the seas — pick a station below.';

  return (
    <div
      className={[
        'admin-shell admin-shell--projects',
        isThor ? 'admin-shell--thor' : 'admin-shell--manga',
        'admin-shell--dashboard',
      ].join(' ')}
      data-mode-target={mode}
    >
      <div
        className="admin-page admin-dash w-full pb-6"
        data-mode={mode}
      >
        <AdminTopBar />

        {/* Decorative backdrop — distinct per mode (defined in CSS) */}
        <div className="admin-dash__backdrop" aria-hidden="true" />

        {/* Set-up-password banner */}
        {!pwBannerDismissed && (
          <div className="admin-pw-banner" role="status">
            <span aria-hidden="true" className="admin-pw-banner__icon">
              {isThor ? '⚡' : '⚓'}
            </span>
            <div className="admin-pw-banner__body">
              <strong>
                {isThor
                  ? 'Set up a password for faster sign-in'
                  : 'Carve a sea code for quicker boarding'}
              </strong>
              <span>
                {isThor
                  ? 'Skip the magic-link wait next time. Takes 30 seconds.'
                  : 'No more waitin’ on snail calls. Takes half a minute.'}
              </span>
            </div>
            <Link to="/admin/account" className="admin-btn">
              {isThor ? 'Open account →' : 'Open badge →'}
            </Link>
            <button
              type="button"
              className="admin-pw-banner__close"
              onClick={dismissPwBanner}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Commander hero strip ─────────────────────────────────────── */}
        <section
          className="admin-commander"
          aria-label={isThor ? 'Command deck overview' : 'Captain’s bridge overview'}
        >
          <div className="admin-commander__halftone" aria-hidden="true" />
          <div className="admin-commander__head">
            <span aria-hidden="true" className="admin-commander__stamp">
              <img
                src={commanderIcon}
                alt=""
                width={56}
                height={56}
                loading="eager"
                decoding="async"
                className="admin-commander__stamp-img"
              />
            </span>
            <div className="admin-commander__copy">
              <span className="admin-commander__eyebrow">{commanderEyebrow}</span>
              <h1 className="admin-commander__title">{commanderTitle}</h1>
              <p className="admin-commander__sub">{commanderSub}</p>
            </div>
            {loading && (
              <span
                className="admin-commander__pulse"
                aria-hidden="true"
                title={isThor ? 'Refreshing…' : 'Heaving…'}
              />
            )}
          </div>

          {/* Stat strip — slim 5-up tiles, scroll on narrow viewports. */}
          <div
            className="admin-stat-strip"
            role="list"
            aria-label={isThor ? 'Command deck stats' : 'Bridge ledger'}
          >
            {statTiles.map((tile) => (
              <div
                key={tile.label.thor}
                role="listitem"
                className="admin-stat-strip__tile"
              >
                <span className="admin-stat-strip__label">
                  {isThor ? tile.label.thor : tile.label.gear5}
                </span>
                <span className="admin-stat-strip__value">
                  <AnimatedCount value={tile.value} />
                </span>
                <span className="admin-stat-strip__hint">
                  {isThor ? tile.hint.thor : tile.hint.gear5}
                </span>
                {tile.stamp && !isThor && (
                  <span aria-hidden="true" className="admin-stat-strip__stamp">
                    {tile.stamp}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards — one per route, manga-panel rhythm. ────────── */}
        <section
          className="admin-deck-cards"
          aria-label={isThor ? 'Command deck stations' : 'Bridge stations'}
        >
          {cards.map((card) => {
            const copy = isThor ? card.thor : card.gear5;
            const iconSrc = isThor
              ? `/assets/Marvel/icons/${card.thorIcon}`
              : `/assets/One-Piece/icons/${card.luffyIcon}`;
            const isActive = location.pathname === card.to ||
              (card.to !== '/admin' && location.pathname.startsWith(card.to + '/'));
            return (
              <Link
                key={card.to}
                to={card.to}
                className={[
                  'admin-deck-card',
                  isActive ? 'admin-deck-card--active' : '',
                ].join(' ').trim()}
                data-mode={mode}
                data-sfx={card.sfx ?? ''}
              >
                <span aria-hidden="true" className="admin-deck-card__iconbox">
                  <img
                    src={iconSrc}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="admin-deck-card__icon-img"
                  />
                </span>
                <h2 className="admin-deck-card__title">{copy.title}</h2>
                <p className="admin-deck-card__desc">{copy.desc}</p>
                <span className="admin-deck-card__cta">
                  {isThor ? 'Open →' : 'Set sail →'}
                </span>
                {card.sfx && !isThor && (
                  <span aria-hidden="true" className="admin-deck-card__sfx">
                    {card.sfx}
                  </span>
                )}
              </Link>
            );
          })}
        </section>

        {/* ── Activity drawer (collapsible, narrow). ───────────────────── */}
        <section className="admin-activity-drawer" data-open={activityOpen ? 'true' : 'false'}>
          <button
            type="button"
            className="admin-activity-drawer__toggle"
            onClick={() => setActivityOpen((v) => !v)}
            aria-expanded={activityOpen}
            aria-controls="admin-activity-feed"
          >
            <span className="admin-activity-drawer__toggle-label">
              {isThor ? 'Recent activity' : 'Recent crew log'}
            </span>
            <span className="admin-activity-drawer__toggle-meta">
              {activity.length} {activity.length === 1 ? 'item' : 'items'} · {activityOpen ? '▴' : '▾'}
            </span>
          </button>
          <div
            id="admin-activity-feed"
            className="admin-activity-drawer__body"
            hidden={!activityOpen}
          >
            {activity.length === 0 && !loading && (
              <p className="admin-activity__empty">
                {isThor
                  ? 'No recent activity yet. Edit a project, change copy, or wait for a new contact message — items will appear here.'
                  : 'Quiet seas, captain. Edit a bounty, scratch the log, or wait for a snail call — entries will surface here.'}
              </p>
            )}
            <ul className="admin-activity__list">
              {activity.map((item) => (
                <li key={item.id} className="admin-activity__item">
                  <span aria-hidden="true" className="admin-activity__icon">
                    {activityIcon(item.source)}
                  </span>
                  <div className="admin-activity__main">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <span className="admin-activity__time">
                    {formatRelative(item.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
