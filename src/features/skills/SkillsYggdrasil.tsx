"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { REALM_STARS, SKILL_DOMAINS } from "@/shared/data/skill-domains";

/**
 * Thor-mode interactive Yggdrasil — 9 realm stars positioned on the
 * canonical YGGDRASIL.png. Click / hover / focus a star to open a
 * portal-style tooltip with the realm's skills.
 *
 * Reads from the same SKILL_DOMAINS the chip grid uses, so every theme
 * shows the same data. Layout is responsive (% coords), tooltip clamps
 * to viewport edges, fully keyboard-accessible (Enter / Space / Esc).
 */

const YGGDRASIL_BG = "/assets/Marvel/skills/YGGDRASIL-transparent.png";

type TooltipState = { left: number; top: number; index: number } | null;

const TOOLTIP_W = 300;
const TOOLTIP_H = 240;

function clampTooltip(
  anchor: DOMRect,
  vw: number,
  vh: number,
  w: number,
  h: number
): { left: number; top: number } {
  const gap = 12;
  // Default: above the star centered
  let left = anchor.left + anchor.width / 2 - w / 2;
  let top = anchor.top - h - gap;
  // If overflowing top, flip to below
  if (top < gap) top = anchor.bottom + gap;
  // Clamp horizontally
  if (left < gap) left = gap;
  if (left + w > vw - gap) left = vw - w - gap;
  // Vertical fallback (very tall tooltip on small viewport)
  if (top + h > vh - gap) top = Math.max(gap, vh - h - gap);
  return { left, top };
}

export function SkillsYggdrasil() {
  const [tip, setTip] = useState<TooltipState>(null);
  const [bgFailed, setBgFailed] = useState(false);

  const openAt = useCallback((el: Element, i: number) => {
    const rect = el.getBoundingClientRect();
    setTip({ ...clampTooltip(rect, window.innerWidth, window.innerHeight, TOOLTIP_W, TOOLTIP_H), index: i });
  }, []);

  const close = useCallback(() => setTip(null), []);

  // Close tooltip on scroll / outside click / Esc
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

  const active = tip ? SKILL_DOMAINS[tip.index] : null;

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

      {/* Star layer */}
      <div className="absolute inset-0">
        {SKILL_DOMAINS.map((domain, i) => {
          const pos = REALM_STARS[i];
          if (!pos) return null;
          const isActive = tip?.index === i;
          return (
            <button
              key={domain.realm}
              type="button"
              aria-label={`${domain.realm} — ${domain.name}. Click to view skills.`}
              aria-expanded={isActive}
              onClick={(e) => {
                if (isActive) close();
                else openAt(e.currentTarget, i);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (isActive) close();
                  else openAt(e.currentTarget, i);
                }
              }}
              onMouseEnter={(e) => openAt(e.currentTarget, i)}
              onMouseLeave={(e) => {
                // Don't close if focus is still on this button
                if (document.activeElement !== e.currentTarget) close();
              }}
              onFocus={(e) => openAt(e.currentTarget, i)}
              onBlur={close}
              className={[
                "yggdrasil-star absolute -translate-x-1/2 -translate-y-1/2",
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full",
                "border border-[var(--color-accent)] grid place-items-center",
                "text-caption font-bold uppercase tracking-wider",
                "transition-[transform,box-shadow,opacity] duration-snap ease-snap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                "hover:scale-125 focus-visible:scale-125",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                background: `radial-gradient(circle, ${domain.color} 0%, color-mix(in oklab, ${domain.color} 30%, transparent) 70%, transparent 100%)`,
                color: "var(--color-accent-contrast)",
                boxShadow: isActive
                  ? `0 0 24px 6px ${domain.color}, inset 0 0 12px ${domain.color}`
                  : `0 0 12px 2px color-mix(in oklab, ${domain.color} 40%, transparent)`,
              }}
            >
              {domain.realm.charAt(0)}
            </button>
          );
        })}
      </div>

      {/* Tooltip — fixed positioned, so it escapes any clipping ancestor */}
      {tip && active && (
        <div
          role="tooltip"
          className="fixed z-[80] glass rounded-lg p-4"
          style={{
            left: tip.left,
            top: tip.top,
            width: TOOLTIP_W,
            maxHeight: TOOLTIP_H,
            overflowY: "auto",
            background: `linear-gradient(180deg, color-mix(in oklab, ${active.color} 14%, var(--color-bg-elevated)), var(--color-bg-elevated))`,
            border: `1px solid ${active.color}`,
            boxShadow: `0 24px 64px -16px ${active.color}aa`,
          }}
        >
          <p className="text-caption uppercase tracking-wider" style={{ color: active.color }}>
            {active.realm}
          </p>
          <p className="text-body font-semibold mt-1">{active.name}</p>
          <p className="text-caption text-muted mt-1 italic">{active.lore}</p>
          <ul className="mt-3 grid gap-1">
            {active.children.map((s) => (
              <li key={s.name} className="text-body-sm">
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-muted">— {s.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
