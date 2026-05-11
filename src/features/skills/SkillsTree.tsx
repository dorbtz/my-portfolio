/**
 * src/components/SkillsTree.tsx — Yggdrasil (Thor) / Grand Line Map (Gear 5)
 *
 * Round 33 rebuild — the World Tree is now a PNG-backed tree (using the
 * hand-painted `public/assets/Marvel/skills/YGGDRASIL-transparent.png`)
 * with 18 realm stars positioned across its branches.
 *
 *   - 9 visited realms (Asgard, Vanaheim, Alfheim, Niflheim, Muspelheim,
 *     Jotunheim, Svartalfheim, Midgard, Helheim) — bright glowing stars on
 *     the canopy / trunk / roots.
 *   - 9 future realms (Wakanda, Sanctum, Vormir, Knowhere, Sakaar, Titan,
 *     Quantum Realm, Battleworld, Eternity) — dim dashed stars on the
 *     upper canopy "sky" tier.
 *
 *   - Hover or focus a star → it scales up 1.5×, the glow intensifies, and
 *     a portalled tooltip appears with the realm name + skills.
 *   - Defensive fallback: if the PNG fails to load (404, slow network), the
 *     container drops back to a plain dark-blue background so the stars
 *     still render and remain interactive.
 *
 * Tooltip = portal-rendered, viewport-fixed (immune to overflow / transforms).
 *
 * Gear 5 mode falls through to GrandLineMap.
 */
import { useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMode } from '../../shared/stores/mode';
import { SKILL_DOMAINS as DEFAULT_DOMAINS, FUTURE_REALMS as DEFAULT_FUTURE_REALMS } from './data/skills';
import type { SkillDomain, FutureRealm } from './data/skills';
import GrandLineMap from './GrandLineMap';
import { computeTooltipPosition } from './lib/tooltipPosition';
import { useSiteContent } from '../content/hooks/useSiteContent';
import { REALM_STARS, FUTURE_STARS, TIER_COLORS } from './SkillsTree.helpers';

const YGGDRASIL_BG = '/assets/Marvel/skills/YGGDRASIL-transparent.png';

/** Hook helper — returns the CMS-driven domains/futureRealms with fallback. */
function useSkillsData() {
  const copy = useSiteContent('skills');
  return useMemo(() => {
    const domains: SkillDomain[] = Array.isArray(copy.domains) && copy.domains.length
      ? (copy.domains as SkillDomain[])
      : DEFAULT_DOMAINS;
    const futureRealms: FutureRealm[] = Array.isArray(copy.futureRealms) && copy.futureRealms.length
      ? (copy.futureRealms as FutureRealm[])
      : DEFAULT_FUTURE_REALMS;
    return { domains, futureRealms };
  }, [copy.domains, copy.futureRealms]);
}

// ---------------------------------------------------------------------------
// Tooltip state — viewport-fixed coordinates for portal rendering.
// ---------------------------------------------------------------------------
type TooltipState = {
  left: number;
  top: number;
  /** Index into SKILL_DOMAINS (kind='realm') or FUTURE_REALMS (kind='future'). */
  index: number;
  kind: 'realm' | 'future';
} | null;

// ---------------------------------------------------------------------------
// Star positions, future-realm tables, and tier-color palette live in
// SkillsTree.helpers.ts so the SkillsTree.tsx file is react-refresh-clean
// (only-export-components rule). Imported above.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AsgardEmblem — inline SVG Vegvisir ("the wayfinder", Odin's iconic Norse
// compass).  An 8-spoke runic star inside a double ring with spear-tipped
// arms.  Used to flank the Yggdrasil title strip per Round 34.
// ---------------------------------------------------------------------------
export function AsgardEmblem({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      className={`yggdrasil-tree__emblem${flipped ? ' yggdrasil-tree__emblem--flip' : ''}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {/* Inner ring */}
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".55" />
      {/* 4 cardinal arms with spear-tip caps */}
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <line x1="32" y1="6"  x2="32" y2="58" />
        <line x1="6"  y1="32" x2="58" y2="32" />
        {/* 4 diagonal arms — half-length, with smaller decorative tips */}
        <line x1="14" y1="14" x2="50" y2="50" opacity=".7" />
        <line x1="50" y1="14" x2="14" y2="50" opacity=".7" />
      </g>
      {/* Spear-tip terminals on the cardinals */}
      <g fill="currentColor">
        <polygon points="32,3  29,9  35,9" />
        <polygon points="32,61 29,55 35,55" />
        <polygon points="3,32  9,29  9,35" />
        <polygon points="61,32 55,29 55,35" />
      </g>
      {/* Centre boss — Odin's all-seeing eye glyph (small filled circle + ring) */}
      <circle cx="32" cy="32" r="3.4" fill="currentColor" />
      <circle cx="32" cy="32" r="6.5" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// YggdrasilTree — PNG-backed World Tree with 18 realm stars
// ---------------------------------------------------------------------------
function YggdrasilTree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [bgFailed, setBgFailed] = useState(false);
  const { domains: SKILL_DOMAINS, futureRealms: FUTURE_REALMS } = useSkillsData();

  // Tooltip dimensions for viewport-edge clamping
  const TOOLTIP_W = 280;
  const TOOLTIP_H = 220;

  function openTooltipForElement(el: Element | null, index: number, kind: 'realm' | 'future') {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pos = computeTooltipPosition(
      { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
      { width: TOOLTIP_W, height: TOOLTIP_H },
    );
    setTooltip({ left: pos.left, top: pos.top, index, kind });
  }

  // Tap-toggle (mobile + click on desktop). Re-tapping the same star closes.
  const handleStarClick = useCallback((e: React.MouseEvent, i: number, kind: 'realm' | 'future') => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const pos = computeTooltipPosition(
      { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
      { width: TOOLTIP_W, height: TOOLTIP_H },
    );
    setTooltip((prev) => {
      if (prev?.kind === kind && prev.index === i) return null;
      return { left: pos.left, top: pos.top, index: i, kind };
    });
  }, []);

  const handleStarKeyDown = useCallback((e: React.KeyboardEvent, i: number, kind: 'realm' | 'future') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      const pos = computeTooltipPosition(
        { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        { width: window.innerWidth, height: window.innerHeight },
        { width: TOOLTIP_W, height: TOOLTIP_H },
      );
      setTooltip((prev) => {
        if (prev?.kind === kind && prev.index === i) return null;
        return { left: pos.left, top: pos.top, index: i, kind };
      });
    }
    if (e.key === 'Escape') setTooltip(null);
  }, []);

  const handleStarHover = useCallback((e: React.MouseEvent, i: number, kind: 'realm' | 'future') => {
    openTooltipForElement(e.currentTarget as Element, i, kind);
  }, []);

  const activeRealm =
    tooltip !== null && tooltip.kind === 'realm' ? SKILL_DOMAINS[tooltip.index] : null;
  const activeFuture =
    tooltip !== null && tooltip.kind === 'future' ? FUTURE_REALMS[tooltip.index] : null;

  // Compose label initials — used inside the star avatar (defensive: works
  // even if no realm imagery is available; the colored circle + initial is
  // legible at all sizes).
  const initial = (s: string) => s.trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Round 62 — Asgardian title strip moved ABOVE the World Tree
          so the YGGDRASIL wordmark + 'World Tree · Nine Realms of
          Engineering' caption render in their own row.  Previously
          the strip sat as the last child of .yggdrasil-tree, where
          the absolute-positioned backdrop PNG painted on top of it
          and clipped the sub-caption. */}
      <div className="yggdrasil-tree__titlebar" aria-hidden="true">
        <AsgardEmblem />
        <div className="yggdrasil-tree__titlebar-words">
          <h3 className="yggdrasil-tree__titlebar-name">YGGDRASIL</h3>
          <p className="yggdrasil-tree__titlebar-sub">
            <span>The</span>
            <strong>World&nbsp;Tree</strong>
            <span aria-hidden="true">·</span>
            <strong>Nine&nbsp;Realms</strong>
            <span>of&nbsp;Engineering</span>
          </p>
        </div>
        <AsgardEmblem flipped />
      </div>

      <div
        ref={containerRef}
        className={`yggdrasil-tree yggdrasil-tree--png${bgFailed ? ' yggdrasil-tree--no-bg' : ''}`}
        aria-label="Yggdrasil — the World Tree of engineering skills. Nine visited realms and nine future destinations."
        role="img"
      >
      {/* Painted World Tree backdrop. Transparent PNG — the dark page
          background shows through where there's no canopy / branches. */}
      <img
        className="yggdrasil-tree__backdrop"
        src={YGGDRASIL_BG}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setBgFailed(true)}
      />

      {/* Star layer — absolutely positioned over the backdrop. */}
      <div className="yggdrasil-tree__starfield" aria-hidden={false}>
        {/* 9 visited realm stars — bright, hover-grow, tooltip with skills. */}
        {SKILL_DOMAINS.map((domain, i) => {
          const pos = REALM_STARS[i];
          if (!pos) return null;
          const color = domain.color;
          return (
            <button
              type="button"
              key={domain.name}
              className={`yggdrasil-star yggdrasil-star--visited yggdrasil-star--${pos.tier}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                ['--star-color' as string]: color,
              }}
              onClick={(e) => handleStarClick(e, i, 'realm')}
              onKeyDown={(e) => handleStarKeyDown(e, i, 'realm')}
              onMouseEnter={(e) => handleStarHover(e, i, 'realm')}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => openTooltipForElement(e.currentTarget as Element, i, 'realm')}
              onBlur={() => setTooltip(null)}
              data-realm={domain.realm}
              data-tier={pos.tier}
              aria-label={`${domain.name}: ${domain.realm}. Click to view skills.`}
            >
              <span className="yggdrasil-star__halo" aria-hidden="true" />
              <span className="yggdrasil-star__core" aria-hidden="true">
                {initial(domain.realm)}
              </span>
              <span className="yggdrasil-star__label" aria-hidden="true">
                {domain.realm}
              </span>
            </button>
          );
        })}

        {/* 9 future realm stars — dim, dashed border, "reserved" tooltip. */}
        {FUTURE_REALMS.map((realm, i) => {
          const pos = FUTURE_STARS[i];
          if (!pos) return null;
          const color = TIER_COLORS[realm.tier];
          return (
            <button
              type="button"
              key={realm.realm}
              className={`yggdrasil-star yggdrasil-star--future yggdrasil-star--${pos.tier}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                ['--star-color' as string]: color,
              }}
              onClick={(e) => handleStarClick(e, i, 'future')}
              onKeyDown={(e) => handleStarKeyDown(e, i, 'future')}
              onMouseEnter={(e) => handleStarHover(e, i, 'future')}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => openTooltipForElement(e.currentTarget as Element, i, 'future')}
              onBlur={() => setTooltip(null)}
              data-future-realm={realm.realm}
              data-future-tier={realm.tier}
              aria-label={`Future realm: ${realm.realm} — ${realm.tier} tier. Reserved for future skill.`}
            >
              <span className="yggdrasil-star__halo" aria-hidden="true" />
              <span className="yggdrasil-star__core" aria-hidden="true">
                {initial(realm.realm)}
              </span>
              <span className="yggdrasil-star__label" aria-hidden="true">
                {realm.realm}
              </span>
            </button>
          );
        })}
      </div>

      {/* Realm tooltip — portalled, viewport-fixed */}
      {tooltip !== null && activeRealm && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            className="yggdrasil-tree__tooltip"
            style={{
              position: 'fixed',
              left: tooltip.left,
              top: tooltip.top,
              maxWidth: 280,
              animation: 'ygg-tooltip-in 180ms ease forwards',
              zIndex: 9000,
              pointerEvents: 'none',
            }}
          >
            <p className="yggdrasil-tree__tooltip-name" style={{ color: activeRealm.color }}>
              {activeRealm.name}
            </p>
            <p
              style={{
                fontSize: '0.65rem',
                color: 'rgba(180, 200, 230, 0.65)',
                marginBottom: '0.5rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {activeRealm.realm}
            </p>
            {activeRealm.children.slice(0, 4).map((skill) => (
              <div key={skill.name} style={{ marginBottom: '0.4rem' }}>
                <div className="yggdrasil-tree__tooltip-skill">
                  <span>{skill.name}</span>
                  <span style={{ color: activeRealm.color }}>{skill.proficiency}%</span>
                </div>
                <div className="yggdrasil-tree__tooltip-bar-bg">
                  <div
                    className="yggdrasil-tree__tooltip-bar-fill"
                    style={{ width: `${skill.proficiency}%`, background: activeRealm.color }}
                  />
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )
      }

      {/* Future-realm tooltip — same portal, no skills grid, lore + tier badge */}
      {tooltip !== null && activeFuture && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            className="yggdrasil-tree__tooltip yggdrasil-tree__tooltip--future"
            data-future-tier={activeFuture.tier}
            style={{
              position: 'fixed',
              left: tooltip.left,
              top: tooltip.top,
              maxWidth: 280,
              animation: 'ygg-tooltip-in 180ms ease forwards',
              zIndex: 9000,
              pointerEvents: 'none',
            }}
          >
            <p
              className="yggdrasil-tree__tooltip-name"
              style={{ color: TIER_COLORS[activeFuture.tier] }}
            >
              {activeFuture.realm}
            </p>
            <span className="yggdrasil-tree__tier-badge">{activeFuture.tier}</span>
            <p
              style={{
                fontSize: '0.78rem',
                lineHeight: 1.5,
                fontStyle: 'italic',
                color: 'rgba(220, 230, 250, 0.85)',
                margin: '0.55rem 0 0.4rem',
              }}
            >
              {activeFuture.lore}
            </p>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'rgba(180, 200, 230, 0.65)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '0.35rem',
              }}
            >
              ✦ {activeFuture.hint}
            </p>
          </div>,
          document.body,
        )
      }

      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public default export — dispatches to Yggdrasil (Thor) or GrandLineMap (Gear 5)
// ---------------------------------------------------------------------------
export default function SkillsTree() {
  const mode = useMode();
  if (mode !== 'thor') {
    return <GrandLineMap />;
  }
  return <YggdrasilTree />;
}
