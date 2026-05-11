/**
 * SectionDivider — mode-themed transition graphic between major sections.
 *
 * May 2026 rewrite. The previous "torn-edge + Mjolnir/Nika stamp" design was
 * replaced with two cleaner, more compact treatments:
 *
 *   Thor mode  : a comic-book "panel break" — black bar with a lightning-bolt
 *                bursting through and halftone dots fading from edges.
 *   Luffy mode : a manga "chapter break" — torn parchment edge + kana SFX
 *                tucked in the corner.
 *
 * Both treatments respect `prefers-reduced-motion: reduce` (no animation in
 * that mode — static graphic only). The variant API is stable so routes.tsx
 * does not need to change; small per-variant tweaks (different SFX text on
 * `after-projects`, e.g.) keep the dividers from feeling identical.
 *
 * Bundle: all SVGs are inline and small (well under 1 KB each). All styles
 * live in src/index.css under `.section-divider` to keep the JS chunk lean.
 */
import { useMode, useMotionOn } from '../stores/mode';

export type DividerVariant =
  | 'after-hero'
  | 'after-about'
  | 'after-skills'
  | 'after-projects';

interface SectionDividerProps {
  variant?: DividerVariant;
}

// Per-variant manga SFX text. Kept short so they read at a glance.
// 大きな冒険 = "great adventure"; 自由の旗 = "flag of freedom";
// 未知の海 = "unknown sea"; 次の章 = "next chapter".
const MANGA_KANA: Record<DividerVariant, string> = {
  'after-hero': '大きな冒険',
  'after-about': '自由の旗',
  'after-projects': '未知の海',
  'after-skills': '次の章',
};

// Per-variant comic SFX text for the Thor / comic-strip lightning panel.
const COMIC_SFX: Record<DividerVariant, string> = {
  'after-hero': 'KRAKKK!',
  'after-about': 'BIFF!',
  'after-projects': 'BOOM!',
  'after-skills': 'ZZAP!',
};

// ---------------------------------------------------------------------------
// Comic panel break — Thor mode
// ---------------------------------------------------------------------------
function ComicPanelBreak({
  variant,
  motionOn,
}: {
  variant: DividerVariant;
  motionOn: boolean;
}) {
  return (
    <div
      className="section-divider section-divider--thor"
      data-variant={variant}
      aria-hidden="true"
    >
      {/* Halftone dots fade in from each edge */}
      <span className="section-divider__halftone section-divider__halftone--left" />
      <span className="section-divider__halftone section-divider__halftone--right" />

      {/* Black panel bar */}
      <span className="section-divider__panel" />

      {/* Lightning bolt bursting through the bar (centered) */}
      <svg
        className={`section-divider__bolt${motionOn ? ' section-divider__bolt--anim' : ''}`}
        viewBox="0 0 120 80"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <defs>
          <linearGradient id="sd-bolt-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7c8" />
            <stop offset="55%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#76cfff" />
          </linearGradient>
        </defs>
        <path
          d="M 70 4 L 32 44 L 56 46 L 40 76 L 88 32 L 64 30 L 78 4 Z"
          fill="url(#sd-bolt-grad)"
          stroke="#0a0d18"
          strokeWidth="2"
          strokeLinejoin="miter"
        />
      </svg>

      {/* Comic SFX tucked above the bar */}
      <span className="section-divider__sfx-comic">{COMIC_SFX[variant]}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manga chapter break — Luffy mode
// ---------------------------------------------------------------------------
function MangaChapterBreak({
  variant,
  motionOn,
}: {
  variant: DividerVariant;
  motionOn: boolean;
}) {
  // Torn paper zigzag — irregular triangular peaks across the top edge.
  // Top edge of the parchment band is the tear; bottom is straight.
  const TEAR_PATH =
    'M 0 18 ' +
    'L 60 4  L 110 22 L 170 6  L 230 24 L 290 8  ' +
    'L 350 22 L 410 4  L 470 20 L 530 6  L 590 22 ' +
    'L 650 4  L 710 22 L 770 8  L 830 20 L 890 6  ' +
    'L 950 22 L 1010 8 L 1070 22 L 1130 6 L 1200 20 ' +
    'L 1200 80 L 0 80 Z';

  return (
    <div
      className="section-divider section-divider--manga"
      data-variant={variant}
      aria-hidden="true"
    >
      <svg
        className="section-divider__paper"
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="sd-paper-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5dc" />
            <stop offset="100%" stopColor="#f6e4b6" />
          </linearGradient>
          <pattern
            id="sd-paper-dots"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="0.9" fill="rgba(140,60,30,0.18)" />
          </pattern>
        </defs>
        {/* Cream parchment with torn upper edge */}
        <path d={TEAR_PATH} fill="url(#sd-paper-grad)" />
        {/* Halftone dot pattern overlay */}
        <path d={TEAR_PATH} fill="url(#sd-paper-dots)" />
        {/* Inked outline along the torn edge */}
        <path
          d={TEAR_PATH.split(' L 1200 80')[0]}
          fill="none"
          stroke="#1a0d05"
          strokeWidth="1.5"
          strokeLinejoin="miter"
          opacity="0.85"
        />
      </svg>

      {/* Kana corner stamp — tucked bottom-right */}
      <span
        className={`section-divider__kana${motionOn ? ' section-divider__kana--anim' : ''}`}
        lang="ja"
      >
        {MANGA_KANA[variant]}
      </span>
    </div>
  );
}

export default function SectionDivider({ variant = 'after-hero' }: SectionDividerProps) {
  const mode = useMode();
  const motionOn = useMotionOn();

  if (mode === 'thor') {
    return <ComicPanelBreak variant={variant} motionOn={motionOn} />;
  }
  return <MangaChapterBreak variant={variant} motionOn={motionOn} />;
}
