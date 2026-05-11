/**
 * src/features/admin-dashboard/admin/AdminPageIcon.tsx
 *
 * Round 28 — extended with the 5 site-content sub-page sections so a
 * sub-page header shows the same icon as its dashboard card.
 *
 * Picks a Marvel .ico in Thor mode and a One-Piece .ico in Luffy mode.
 */

import { useMode } from '../../../stores/mode';

type Section =
  | 'projects'
  | 'content'
  // Round 28: per-section content editors get their own icon mappings so
  // the sub-page header icon matches the dashboard card icon exactly.
  | 'content-hero'
  | 'content-about'
  | 'content-skills'
  | 'content-projects'
  | 'content-contact'
  // Round 64: Phase B of the hidden D-B-T admin entry.
  | 'content-admin'
  | 'messages'
  | 'allowlist'
  | 'health'
  | 'mcp'
  | 'account'
  | 'dev';

/* Mapping mirrors AdminDashboard.FEATURE_CARDS. If you change a card
   icon there, change it here too so the sub-page header stays in sync. */
const ICONS: Record<Section, { thor: string; luffy: string }> = {
  projects:           { thor: 'captain-shield.ico', luffy: 'zoro.ico'    },
  content:            { thor: 'stan-lee.ico',       luffy: 'robin.ico'   },
  'content-hero':     { thor: 'mjolnir.ico',        luffy: 'strawhatflag.ico' },
  'content-about':    { thor: 'stan-lee.ico',       luffy: 'robin.ico'   },
  'content-skills':   { thor: 'wolverin.ico',       luffy: 'zoro.ico'    },
  'content-projects': { thor: 'milesmorales.ico',   luffy: 'usopp.ico'   },
  'content-contact':  { thor: 'spiderman.ico',      luffy: 'brook.ico'   },
  'content-admin':    { thor: 'mjolnir.ico',        luffy: 'luffy.ico'   },
  messages:           { thor: 'spiderman.ico',      luffy: 'bear.ico'    },
  allowlist:          { thor: 'blackpanther.ico',   luffy: 'nami.ico'    },
  health:             { thor: 'ironman.ico',        luffy: 'chooper.ico' },
  mcp:                { thor: 'wolverin.ico',       luffy: 'franky.ico'  },
  account:            { thor: 'mjolnir.ico',        luffy: 'sanji.ico'   },
  dev:                { thor: 'deadpool.ico',       luffy: 'franky.ico'  },
};

type Props = {
  section: Section;
  /** Pixel size — defaults to 28. */
  size?: number;
};

export default function AdminPageIcon({ section, size = 28 }: Props) {
  const mode = useMode();
  const isThor = mode === 'thor';
  const file = ICONS[section];
  const src = isThor
    ? `/assets/Marvel/icons/${file.thor}`
    : `/assets/One-Piece/icons/${file.luffy}`;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="admin-page-icon"
      style={{ flex: '0 0 auto', objectFit: 'contain' }}
    />
  );
}
