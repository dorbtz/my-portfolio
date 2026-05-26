"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import {
  DAWN_ISLAND,
  FUTURE_ISLAND_POSITIONS,
  FUTURE_ISLANDS,
  ISLAND_FILES,
  ISLAND_POSITIONS,
  SKILL_DOMAINS,
  type FutureIsland,
  type OriginIsland,
  type SkillDomain,
} from "@/shared/data/skill-domains";

/**
 * Luffy-mode interactive Grand Line —
 *  - 1 Dawn Island origin marker (Luffy's home; renders backstory sections)
 *  - 9 visited island thumbnails (Whiskey Peak → Sabaody) along the Line
 *  - 9 future islands (Fishman Island → Laugh Tale) at smaller scale
 *
 * Same tooltip pattern as Yggdrasil — 6px gap + pointer-events:none so the
 * popup feels attached to the island but never captures hover.
 */

const ISLANDS_DIR = "/assets/One-Piece/islands";

type ActiveKind = "visited" | "future" | "origin";
type TooltipState = { left: number; top: number; width: number; index: number; kind: ActiveKind } | null;

const TOOLTIP_H = 280;
const GAP = 6;
const MARGIN = 12;

function tooltipWidth(vw: number): number {
  return Math.min(320, vw - MARGIN * 2);
}

function clampTooltip(
  anchor: DOMRect,
  vw: number,
  vh: number,
  w: number,
  h: number
): { left: number; top: number; width: number } {
  const width = Math.min(w, vw - MARGIN * 2);
  let left = anchor.left + anchor.width / 2 - width / 2;
  let top = anchor.top - h - GAP;
  if (top < MARGIN) top = anchor.bottom + GAP;
  left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));
  top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
  return { left, top, width };
}

export function SkillsGrandLine() {
  const [tip, setTip] = useState<TooltipState>(null);

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
    <div className="grandline-wrap relative w-full" style={{ aspectRatio: "16 / 9" }}>
      {/* Dashed line through visited islands */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={`M ${[DAWN_ISLAND.pos, ...ISLAND_POSITIONS].map((p) => `${p.x},${p.y}`).join(" L ")}`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.4"
          strokeDasharray="2 2"
          opacity="0.6"
        />
      </svg>

      <div className="absolute inset-0">
        {/* Dawn Island — origin */}
        <OriginMarker
          island={DAWN_ISLAND}
          isActive={tip?.kind === "origin"}
          onOpen={(el) => openAt(el, 0, "origin")}
          onClose={close}
        />

        {/* Visited islands */}
        {SKILL_DOMAINS.map((domain, i) => (
          <VisitedMarker
            key={`v-${domain.island}`}
            domain={domain}
            file={ISLAND_FILES[i]}
            pos={ISLAND_POSITIONS[i]}
            isActive={tip?.kind === "visited" && tip.index === i}
            onOpen={(el) => openAt(el, i, "visited")}
            onClose={close}
          />
        ))}

        {/* Future islands — smaller, dimmer, dashed border */}
        {FUTURE_ISLANDS.map((island, i) => (
          <FutureMarker
            key={`f-${island.island}`}
            island={island}
            pos={FUTURE_ISLAND_POSITIONS[i]}
            isActive={tip?.kind === "future" && tip.index === i}
            onOpen={(el) => openAt(el, i, "future")}
            onClose={close}
          />
        ))}
      </div>

      {tip?.kind === "visited" && SKILL_DOMAINS[tip.index] && (
        <VisitedTooltip domain={SKILL_DOMAINS[tip.index]} left={tip.left} top={tip.top} width={tip.width} />
      )}
      {tip?.kind === "future" && FUTURE_ISLANDS[tip.index] && (
        <FutureTooltip island={FUTURE_ISLANDS[tip.index]} left={tip.left} top={tip.top} width={tip.width} />
      )}
      {tip?.kind === "origin" && (
        <OriginTooltip island={DAWN_ISLAND} left={tip.left} top={tip.top} width={tip.width} />
      )}
    </div>
  );
}

// ---------- markers ----------

function OriginMarker({
  island,
  isActive,
  onOpen,
  onClose,
}: {
  island: OriginIsland;
  isActive: boolean;
  onOpen: (el: Element) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${island.island} — origin`}
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
        "w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden",
        "transition-[transform,box-shadow] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "hover:scale-110 focus-visible:scale-110",
      ].join(" ")}
      style={{
        left: `${island.pos.x}%`,
        top: `${island.pos.y}%`,
        border: "3px solid #ffc60b",
        boxShadow: isActive
          ? "0 0 24px 6px #ffc60b, inset 0 0 12px rgba(0,0,0,0.5)"
          : "0 0 16px 4px rgba(255,198,11,0.45)",
        background: "#1a0f08",
      }}
    >
      <span
        aria-hidden
        className="w-full h-full grid place-items-center text-h3 font-bold"
        style={{ color: "#ffc60b" }}
      >
        ☀
      </span>
      <span
        aria-hidden
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-caption font-bold whitespace-nowrap"
        style={{ color: "#ffc60b" }}
      >
        {island.island}
      </span>
    </button>
  );
}

function VisitedMarker({
  domain,
  file,
  pos,
  isActive,
  onOpen,
  onClose,
}: {
  domain: SkillDomain;
  file: string;
  pos: { x: number; y: number };
  isActive: boolean;
  onOpen: (el: Element) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${domain.island} — ${domain.name}`}
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
        "w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden",
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
          : "0 4px 16px rgba(0,0,0,0.35)",
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
}

function FutureMarker({
  island,
  pos,
  isActive,
  onOpen,
  onClose,
}: {
  island: FutureIsland;
  pos: { x: number; y: number };
  isActive: boolean;
  onOpen: (el: Element) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${island.island} — ${island.hint}`}
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
        "w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden",
        "transition-[transform,opacity] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "hover:scale-125 focus-visible:scale-125",
      ].join(" ")}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: `2px dashed ${island.color}`,
        opacity: isActive ? 1 : 0.7,
        boxShadow: isActive ? `0 0 16px 4px ${island.color}` : "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${island.file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
        style={{ filter: "grayscale(60%)" }}
      />
    </button>
  );
}

// ---------- tooltips ----------

function VisitedTooltip({ domain, left, top, width }: { domain: SkillDomain; left: number; top: number; width: number }) {
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-md p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        maxHeight: TOOLTIP_H,
        overflowY: "auto",
        background: "var(--color-bg-elevated)",
        border: `3px solid color-mix(in oklab, var(--color-text) 88%, transparent)`,
        boxShadow: `5px 5px 0 0 color-mix(in oklab, var(--color-text) 92%, transparent)`,
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: domain.color }}>
        {domain.gear} · {domain.island}
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

function FutureTooltip({ island, left, top, width }: { island: FutureIsland; left: number; top: number; width: number }) {
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-md p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        background: "var(--color-bg-elevated)",
        border: `2px dashed ${island.color}`,
        boxShadow: "4px 4px 0 0 color-mix(in oklab, var(--color-text) 60%, transparent)",
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: island.color }}>
        {island.gear} · Future
      </p>
      <p className="text-body font-semibold mt-1 text-fg">{island.island}</p>
      <p className="text-caption text-muted mt-1 italic">{island.lore}</p>
      <p className="text-body-sm text-muted mt-2">— {island.hint}</p>
    </div>
  );
}

function OriginTooltip({ island, left, top, width }: { island: OriginIsland; left: number; top: number; width: number }) {
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-md p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        maxHeight: TOOLTIP_H + 60,
        overflowY: "auto",
        background: "var(--color-bg-elevated)",
        border: "3px solid #ffc60b",
        boxShadow: "5px 5px 0 0 #ffc60b88",
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: "#ffc60b" }}>
        ORIGIN · {island.sub}
      </p>
      <p className="text-body font-semibold mt-1 text-fg">{island.island}</p>
      <p className="text-caption text-muted mt-1 italic">{island.lore}</p>
      <div className="mt-3 grid gap-2">
        {island.sections.map((s) => (
          <div key={s.title}>
            <p className="text-body-sm font-semibold text-fg">{s.title}</p>
            <p className="text-caption text-muted mt-0.5">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
