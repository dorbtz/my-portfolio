"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { ISLAND_FILES, ISLAND_POSITIONS, SKILL_DOMAINS } from "@/shared/data/skill-domains";

/**
 * Luffy-mode interactive Grand Line — 9 island thumbnails along the
 * Grand Line, each clickable to reveal its skill cluster + lore in a
 * portal-positioned tooltip. Same data, same UX patterns as the
 * Yggdrasil. Islands use the existing WEBP assets in
 * public/assets/One-Piece/islands/.
 */

const ISLANDS_DIR = "/assets/One-Piece/islands";

type TooltipState = { left: number; top: number; index: number } | null;

const TOOLTIP_W = 300;
const TOOLTIP_H = 260;

function clampTooltip(
  anchor: DOMRect,
  vw: number,
  vh: number,
  w: number,
  h: number
): { left: number; top: number } {
  const gap = 12;
  let left = anchor.left + anchor.width / 2 - w / 2;
  let top = anchor.top - h - gap;
  if (top < gap) top = anchor.bottom + gap;
  if (left < gap) left = gap;
  if (left + w > vw - gap) left = vw - w - gap;
  if (top + h > vh - gap) top = Math.max(gap, vh - h - gap);
  return { left, top };
}

export function SkillsGrandLine() {
  const [tip, setTip] = useState<TooltipState>(null);

  const openAt = useCallback((el: Element, i: number) => {
    const rect = el.getBoundingClientRect();
    setTip({ ...clampTooltip(rect, window.innerWidth, window.innerHeight, TOOLTIP_W, TOOLTIP_H), index: i });
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

  const active = tip ? SKILL_DOMAINS[tip.index] : null;

  return (
    <div className="grandline-wrap relative w-full" style={{ aspectRatio: "16 / 9" }}>
      {/* Hand-drawn Grand Line path connecting the islands. SVG sits
          below the islands; positions match ISLAND_POSITIONS. */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={`M ${ISLAND_POSITIONS.map((p) => `${p.x},${p.y}`).join(" L ")}`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.4"
          strokeDasharray="2 2"
          opacity="0.5"
        />
      </svg>

      {/* Island thumbnails */}
      <div className="absolute inset-0">
        {SKILL_DOMAINS.map((domain, i) => {
          const pos = ISLAND_POSITIONS[i];
          const file = ISLAND_FILES[i];
          const isActive = tip?.index === i;
          return (
            <button
              key={domain.island}
              type="button"
              aria-label={`${domain.island} — ${domain.name}. Click to view skills.`}
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
                if (document.activeElement !== e.currentTarget) close();
              }}
              onFocus={(e) => openAt(e.currentTarget, i)}
              onBlur={close}
              className={[
                "grandline-island absolute -translate-x-1/2 -translate-y-1/2",
                "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden",
                "transition-[transform,box-shadow] duration-snap ease-snap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                "hover:scale-110 focus-visible:scale-110",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                border: `2px solid ${domain.color}`,
                boxShadow: isActive
                  ? `0 0 24px 6px ${domain.color}, inset 0 0 12px rgba(0,0,0,0.5)`
                  : `0 4px 16px rgba(0,0,0,0.35)`,
              }}
            >
              <img
                src={`${ISLANDS_DIR}/${file}.webp`}
                alt=""
                aria-hidden
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
              <span
                aria-hidden
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-caption font-bold whitespace-nowrap"
                style={{ color: domain.color }}
              >
                {domain.island}
              </span>
            </button>
          );
        })}
      </div>

      {tip && active && (
        <div
          role="tooltip"
          className="fixed z-[80] rounded-lg p-4"
          style={{
            left: tip.left,
            top: tip.top,
            width: TOOLTIP_W,
            maxHeight: TOOLTIP_H,
            overflowY: "auto",
            background: "var(--color-bg-elevated)",
            border: `3px solid color-mix(in oklab, var(--color-text) 88%, transparent)`,
            boxShadow: `5px 5px 0 0 color-mix(in oklab, var(--color-text) 92%, transparent)`,
            fontFamily: "var(--font-display, sans-serif)",
          }}
        >
          <p className="text-caption uppercase tracking-wider" style={{ color: active.color }}>
            {active.gear} · {active.island}
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
