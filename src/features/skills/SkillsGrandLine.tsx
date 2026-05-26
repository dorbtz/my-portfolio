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
 * Luffy-mode interactive Grand Line — uses the canon WORLDMAP.jpeg as the
 * map base (fan-made, painted, full world geography 1:1) and overlays
 * interactive skill markers at canonical island positions.
 *
 * Markers are small + low-key so they don't compete with the map's own
 * painted islands. Hovering one lifts + glows it; clicking opens the
 * tooltip with the same skill data the chip grid uses.
 *
 * Positions are approximate (the actual map has hundreds of unnamed islets
 * around the canon ones). If a position is visibly off-island, nudge the
 * { x, y } in shared/data/skill-domains.ts — both halves of the map
 * (ISLAND_POSITIONS + FUTURE_ISLAND_POSITIONS) live there.
 */

const ISLANDS_DIR = "/assets/One-Piece/islands";
const WORLDMAP_SRC = "/assets/One-Piece/WORLDMAP.jpeg";

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
    <div
      className="grandline-wrap relative w-full rounded-lg overflow-hidden border border-line"
      // Native ratio of the JPEG: 4096 × 2085 ≈ 1.964:1. Use that exactly
      // so the painted geography doesn't get squashed or letterboxed.
      style={{ aspectRatio: "4096 / 2085" }}
    >
      {/* Canon world map as the base */}
      <img
        src={WORLDMAP_SRC}
        alt="One Piece world map (fan-made) — North/South/East/West Blue, Red Line, Calm Belt, Grand Line, and Paradise → New World"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        draggable={false}
      />

      {/* Subtle dark vignette so the markers + tooltips read clearly on top */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Marker layer */}
      <div className="absolute inset-0">
        <OriginMarker
          island={DAWN_ISLAND}
          isActive={tip?.kind === "origin"}
          onOpen={(el) => openAt(el, 0, "origin")}
          onClose={close}
        />
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
        {FUTURE_ISLANDS.map((island, i) => (
          <PostParadiseMarker
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

// ---------- markers (small + halo so they read on top of the painted map) ----------

const MARKER_BASE =
  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden " +
  "transition-[transform,box-shadow] duration-snap ease-snap " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
  "hover:scale-125 focus-visible:scale-125 ";

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
      className={MARKER_BASE + "w-9 h-9 sm:w-10 sm:h-10"}
      style={{
        left: `${island.pos.x}%`,
        top: `${island.pos.y}%`,
        border: "2px solid #ffc60b",
        boxShadow: isActive
          ? "0 0 16px 6px #ffc60b, 0 0 2px 1px rgba(0,0,0,0.6)"
          : "0 0 12px 3px rgba(255,198,11,0.7), 0 0 2px 1px rgba(0,0,0,0.6)",
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${island.file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />
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
      className={MARKER_BASE + "w-7 h-7 sm:w-8 sm:h-8"}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: `2px solid ${domain.color}`,
        boxShadow: isActive
          ? `0 0 16px 6px ${domain.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : `0 0 10px 2px ${domain.color}aa, 0 0 2px 1px rgba(0,0,0,0.6)`,
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />
    </button>
  );
}

function PostParadiseMarker({
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
  const isFuture = island.status === "future";
  const isCurrent = island.status === "current";
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
      className={
        MARKER_BASE +
        (isFuture ? "w-6 h-6 sm:w-7 sm:h-7 " : "w-7 h-7 sm:w-8 sm:h-8 ") +
        (isCurrent ? "grandline-current-pulse" : "")
      }
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: isFuture ? `2px dashed ${island.color}` : `2px solid ${island.color}`,
        opacity: isFuture && !isActive ? 0.85 : 1,
        boxShadow: isActive
          ? `0 0 16px 6px ${island.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : isCurrent
          ? `0 0 14px 4px ${island.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : `0 0 8px 2px ${island.color}aa, 0 0 2px 1px rgba(0,0,0,0.6)`,
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${island.file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
        style={{ filter: isFuture ? "grayscale(40%)" : "none" }}
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
  const statusLabel =
    island.status === "current" ? "Current arc" : island.status === "future" ? "Future" : "Visited";
  return (
    <div
      role="tooltip"
      className="fixed z-[80] rounded-md p-4 pointer-events-none"
      style={{
        left,
        top,
        width,
        background: "var(--color-bg-elevated)",
        border:
          island.status === "future"
            ? `2px dashed ${island.color}`
            : `2px solid ${island.color}`,
        boxShadow: "4px 4px 0 0 color-mix(in oklab, var(--color-text) 60%, transparent)",
      }}
    >
      <p className="text-caption uppercase tracking-wider" style={{ color: island.color }}>
        {island.gear} · {statusLabel}
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
