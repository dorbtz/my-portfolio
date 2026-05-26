"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import {
  FUTURE_REALMS,
  FUTURE_REALM_STARS,
  REALM_STARS,
  SKILL_DOMAINS,
  type FutureRealm,
  type SkillDomain,
  type StarPos,
} from "@/shared/data/skill-domains";

/**
 * Thor-mode interactive Yggdrasil — 9 visited realm stars + 9 future
 * (Marvel multiverse) realm stars on the canonical YGGDRASIL.png.
 *
 * Visited stars are bright + filled with the domain's accent color.
 * Future stars are dimmer + dashed-border + show a "reserved" tooltip.
 *
 * Tooltip uses a 6px gap to feel attached to the star (was 12px) +
 * pointer-events:none so it doesn't capture the hover and cause flicker.
 * Fully keyboard-accessible (Enter / Space toggle, Esc close).
 */

const YGGDRASIL_BG = "/assets/Marvel/skills/YGGDRASIL-transparent.png";

type ActiveKind = "visited" | "future";
type TooltipState = { left: number; top: number; width: number; index: number; kind: ActiveKind } | null;

const TOOLTIP_H = 240;
const GAP = 6;
const MARGIN = 12; // minimum distance to viewport edge — keeps tooltip readable

/** Tooltip width adapts to viewport: caps at 300px, shrinks on small phones
 *  so the popup is never wider than the screen minus a safe margin. */
function tooltipWidth(vw: number): number {
  return Math.min(300, vw - MARGIN * 2);
}

function clampTooltip(
  anchor: DOMRect,
  vw: number,
  vh: number,
  w: number,
  h: number
): { left: number; top: number; width: number } {
  // Final width — never wider than viewport minus the margin on each side.
  const width = Math.min(w, vw - MARGIN * 2);
  // Center on the anchor, then clamp.
  let left = anchor.left + anchor.width / 2 - width / 2;
  let top = anchor.top - h - GAP;
  if (top < MARGIN) top = anchor.bottom + GAP;
  // Horizontal clamp — Math.max guards against negative when width === vw - 2*MARGIN
  left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));
  // Vertical clamp (tall tooltip on short viewport)
  top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
  return { left, top, width };
}

export function SkillsYggdrasil() {
  const [tip, setTip] = useState<TooltipState>(null);
  const [bgFailed, setBgFailed] = useState(false);

  const openAt = useCallback((el: Element, i: number, kind: ActiveKind) => {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setTip({
      ...clampTooltip(rect, vw, vh, tooltipWidth(vw), TOOLTIP_H),
      index: i,
      kind,
    });
  }, []);

  const close = useCallback(() => setTip(null), []);

  useEffect(() => {
    if (!tip) return;
    const onScroll = () => close();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [tip, close]);

  return (
    <div className="yggdrasil-wrap relative w-full" style={{ aspectRatio: "16 / 10" }}>
      {!bgFailed && (
        <img
          src={YGGDRASIL_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none opacity-90"
          onError={() => setBgFailed(true)}
          loading="lazy"
        />
      )}

      <div className="absolute inset-0">
        {/* Visited realms — bright */}
        {SKILL_DOMAINS.map((domain, i) => (
          <RealmStar
            key={`v-${domain.realm}`}
            kind="visited"
            domain={domain}
            pos={REALM_STARS[i]}
            isActive={tip?.kind === "visited" && tip.index === i}
            onOpen={(el) => openAt(el, i, "visited")}
            onClose={close}
          />
        ))}
        {/* Future realms — dim + dashed */}
        {FUTURE_REALMS.map((realm, i) => (
          <FutureStar
            key={`f-${realm.realm}`}
            realm={realm}
            pos={FUTURE_REALM_STARS[i]}
            isActive={tip?.kind === "future" && tip.index === i}
            onOpen={(el) => openAt(el, i, "future")}
            onClose={close}
          />
        ))}
      </div>

      {tip?.kind === "visited" && SKILL_DOMAINS[tip.index] && (
        <VisitedTooltip domain={SKILL_DOMAINS[tip.index]} left={tip.left} top={tip.top} width={tip.width} />
      )}
      {tip?.kind === "future" && FUTURE_REALMS[tip.index] && (
        <FutureTooltip realm={FUTURE_REALMS[tip.index]} left={tip.left} top={tip.top} width={tip.width} />
      )}
    </div>
  );
}

// ---------- subcomponents ----------

function RealmStar({
  domain,
  pos,
  isActive,
  onOpen,
  onClose,
}: {
  kind: "visited";
  domain: SkillDomain;
  pos: StarPos;
  isActive: boolean;
  onOpen: (el: Element) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${domain.realm} — ${domain.name}`}
      aria-expanded={isActive}
      onClick={(e) => (isActive ? onClose() : onOpen(e.currentTarget))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isActive ? onClose() : onOpen(e.currentTarget);
        }
      }}
      onMouseEnter={(e) => onOpen(e.currentTarget)}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget) onClose();
      }}
      onFocus={(e) => onOpen(e.currentTarget)}
      onBlur={onClose}
      className={[
        "absolute -translate-x-1/2 -translate-y-1/2",
        "w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2",
        "grid place-items-center text-caption font-bold uppercase tracking-wider",
        "transition-[transform,box-shadow] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "hover:scale-125 focus-visible:scale-125",
      ].join(" ")}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        background: `radial-gradient(circle, ${domain.color} 0%, color-mix(in oklab, ${domain.color} 30%, transparent) 70%, transparent 100%)`,
        color: "#0a0f1e",
        borderColor: domain.color,
        boxShadow: isActive
          ? `0 0 24px 6px ${domain.color}, inset 0 0 12px ${domain.color}`
          : `0 0 12px 2px color-mix(in oklab, ${domain.color} 40%, transparent)`,
      }}
    >
      {domain.realm.charAt(0)}
    </button>
  );
}

function FutureStar({
  realm,
  pos,
  isActive,
  onOpen,
  onClose,
}: {
  realm: FutureRealm;
  pos: StarPos;
  isActive: boolean;
  onOpen: (el: Element) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${realm.realm} — ${realm.hint}`}
      aria-expanded={isActive}
      onClick={(e) => (isActive ? onClose() : onOpen(e.currentTarget))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isActive ? onClose() : onOpen(e.currentTarget);
        }
      }}
      onMouseEnter={(e) => onOpen(e.currentTarget)}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget) onClose();
      }}
      onFocus={(e) => onOpen(e.currentTarget)}
      onBlur={onClose}
      className={[
        "absolute -translate-x-1/2 -translate-y-1/2",
        // Mobile: 44px tap target (Apple HIG min). Desktop: visual restraint.
        "w-11 h-11 sm:w-7 sm:h-7 rounded-full",
        "transition-[transform,opacity] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "hover:scale-150 focus-visible:scale-150",
      ].join(" ")}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: `2px dashed ${realm.color}`,
        background: `color-mix(in oklab, ${realm.color} 15%, transparent)`,
        opacity: isActive ? 1 : 0.7,
        boxShadow: isActive ? `0 0 16px 4px ${realm.color}` : "none",
      }}
    />
  );
}

function VisitedTooltip({ domain, left, top, width }: { domain: SkillDomain; left: number; top: number; width: number }) {
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-lg p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        maxHeight: TOOLTIP_H,
        overflowY: "auto",
        background: `linear-gradient(180deg, color-mix(in oklab, ${domain.color} 14%, var(--color-bg-elevated)), var(--color-bg-elevated))`,
        border: `1px solid ${domain.color}`,
        boxShadow: `0 24px 64px -16px ${domain.color}aa`,
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: domain.color }}>
        {domain.realm}
      </p>
      <p className="text-body font-semibold mt-1 text-fg">{domain.name}</p>
      <p className="text-caption text-muted mt-1 italic">{domain.lore}</p>
      <ul className="mt-3 grid gap-1">
        {domain.children.map((s) => (
          <li key={s.name} className="text-body-sm text-fg">
            <span className="font-medium">{s.name}</span>{" "}
            <span className="text-muted">— {s.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FutureTooltip({ realm, left, top, width }: { realm: FutureRealm; left: number; top: number; width: number }) {
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-lg p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        background: "var(--color-bg-elevated)",
        border: `1px dashed ${realm.color}`,
        boxShadow: `0 16px 48px -16px ${realm.color}66`,
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: realm.color }}>
        {realm.tier} · Future
      </p>
      <p className="text-body font-semibold mt-1 text-fg">{realm.realm}</p>
      <p className="text-caption text-muted mt-1 italic">{realm.lore}</p>
      <p className="text-body-sm text-muted mt-2">— {realm.hint}</p>
    </div>
  );
}
