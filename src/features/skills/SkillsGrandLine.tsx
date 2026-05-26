"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import {
  DAWN_ISLAND,
  FUTURE_ISLAND_POSITIONS,
  FUTURE_ISLANDS,
  ISLAND_FILES,
  ISLAND_POSITIONS,
  MARIEJOIS_POS,
  RED_LINE_SEGMENTS,
  RED_LINE_X,
  REVERSE_MOUNTAIN_POS,
  SKILL_DOMAINS,
  type FutureIsland,
  type OriginIsland,
  type SkillDomain,
} from "@/shared/data/skill-domains";

/**
 * Luffy-mode interactive Grand Line — canon-accurate cartography.
 *
 *   East Blue (right edge): Dawn Island origin
 *   Reverse Mountain (top-right): entry to the Grand Line from the Blues
 *   Paradise (upper half, going west): 9 Straw Hat arcs Whiskey Peak → Sabaody
 *   Red Line (vertical wall, left-center): 5 stacked segments with Mariejois
 *      at the top and Fishman Island under it
 *   New World (lower half, going east from Fishman Island):
 *      Punk Hazard → Dressrosa → Zou → Whole Cake → Wano → Egghead → Elbaph (current arc)
 *      → Laugh Tale (legendary final, the only true future)
 *
 * A dashed sailing route connects everything in canonical order. Reverse
 * Mountain renders the 4 ascending currents from each Blue + 1 descending
 * into Paradise (5 currents — matches the canonical depiction).
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

/**
 * Canonical sailing route: Dawn → Reverse Mountain → all 9 visited
 * skill islands → Sabaody (foot of Red Line) → curves through the
 * Red Line crossing → Fishman Island → all post-Paradise islands in
 * canon order → ends at the current arc (Elbaph), with a dashed
 * fade-out toward Laugh Tale.
 *
 * Returns an SVG path "d" string spanning the visited route, plus a
 * second path for the dashed future segment to Laugh Tale.
 */
function buildSailingPath(): { solid: string; future: string } {
  const points: Array<{ x: number; y: number }> = [];
  points.push(DAWN_ISLAND.pos);
  points.push(REVERSE_MOUNTAIN_POS);
  // Whiskey Peak is index 0 — Reverse Mountain feeds into it directly.
  for (const p of ISLAND_POSITIONS) points.push(p);
  // After Sabaody (last entry of ISLAND_POSITIONS), the route curves down
  // through the Red Line to Fishman Island. We add a virtual control point
  // at the Red Line crossing for a smoother arc.
  points.push({ x: 12, y: 47 }); // crossing point under Sabaody
  // All future islands EXCEPT the last (Laugh Tale) — those are canon-visited
  // through Elbaph.
  for (let i = 0; i < FUTURE_ISLAND_POSITIONS.length - 1; i++) {
    points.push(FUTURE_ISLAND_POSITIONS[i]);
  }
  const solid = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  // Future segment: last visited (Elbaph) → Laugh Tale, rendered dashed.
  const elbaph = FUTURE_ISLAND_POSITIONS[FUTURE_ISLAND_POSITIONS.length - 2];
  const laughTale = FUTURE_ISLAND_POSITIONS[FUTURE_ISLAND_POSITIONS.length - 1];
  const future = `M ${elbaph.x.toFixed(2)} ${elbaph.y.toFixed(2)} L ${laughTale.x.toFixed(2)} ${laughTale.y.toFixed(2)}`;

  return { solid, future };
}

const ROUTE = buildSailingPath();

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
    <div className="grandline-wrap relative w-full" style={{ aspectRatio: "16 / 10" }}>
      {/* Map base — Blues, Red Line, Reverse Mountain, sailing route */}
      <MapBase />

      <div className="absolute inset-0">
        {/* Dawn Island — East Blue origin (uses the dawn-island.webp asset) */}
        <OriginMarker
          island={DAWN_ISLAND}
          isActive={tip?.kind === "origin"}
          onOpen={(el) => openAt(el, 0, "origin")}
          onClose={close}
        />

        {/* Visited skill islands — Paradise (top half) */}
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

        {/* Post-Paradise islands — New World (bottom half) */}
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

// ---------- Map base (decorations: Blues, Red Line, Reverse Mountain, route) ----------

function MapBase() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 62.5"
      preserveAspectRatio="none"
    >
      {/* Subtle ocean wash so the map reads as water */}
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.10" />
        </linearGradient>
        <pattern id="paper-grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.25" fill="currentColor" opacity="0.04" />
          <circle cx="4" cy="4" r="0.25" fill="currentColor" opacity="0.04" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="62.5" fill="url(#ocean)" />
      <rect x="0" y="0" width="100" height="62.5" fill="url(#paper-grain)" className="text-fg" />

      {/* Quadrant labels — North/South/East/West Blues */}
      <g
        fontFamily="var(--font-luffy, Bangers), Comic Sans MS, cursive"
        fontSize="2.4"
        letterSpacing="0.4"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.4"
        className="text-fg"
      >
        <text x="50" y="3.5">NORTH BLUE</text>
        <text x="50" y="60.5">SOUTH BLUE</text>
        <text x="92" y="11" textAnchor="middle">EAST BLUE</text>
        <text x="3" y="32" textAnchor="start">WEST</text>
        <text x="3" y="35" textAnchor="start">BLUE</text>
      </g>

      {/* PARADISE / NEW WORLD labels along the Grand Line band */}
      <g
        fontFamily="var(--font-luffy, Bangers), Comic Sans MS, cursive"
        fontSize="3.5"
        letterSpacing="0.6"
        fill="var(--color-accent)"
        opacity="0.55"
      >
        <text x="48" y="20" textAnchor="end">PARADISE</text>
        <text x="52" y="49" textAnchor="start">NEW WORLD</text>
      </g>

      {/* Red Line — vertical wall split into 5 segments */}
      <g>
        {Array.from({ length: RED_LINE_SEGMENTS }).map((_, i) => {
          const segH = (62.5 - 2) / RED_LINE_SEGMENTS;
          const gap = 0.8;
          const y = 1 + i * segH;
          return (
            <rect
              key={i}
              x={RED_LINE_X.left}
              y={y + gap / 2}
              width={RED_LINE_X.right - RED_LINE_X.left}
              height={segH - gap}
              fill="#d90429"
              opacity={0.55}
              rx={0.8}
            />
          );
        })}
        {/* Red Line texture line down the middle */}
        <line
          x1={(RED_LINE_X.left + RED_LINE_X.right) / 2}
          y1="1"
          x2={(RED_LINE_X.left + RED_LINE_X.right) / 2}
          y2="61.5"
          stroke="#7a0316"
          strokeWidth="0.3"
          strokeDasharray="0.6 0.4"
          opacity="0.6"
        />
      </g>

      {/* Mariejois label at top of Red Line */}
      <g>
        <circle cx={MARIEJOIS_POS.x} cy={MARIEJOIS_POS.y} r="1.6" fill="#f5c518" opacity="0.85" />
        <text
          x={MARIEJOIS_POS.x + 2.6}
          y={MARIEJOIS_POS.y + 0.6}
          fontFamily="var(--font-luffy, Bangers), Comic Sans MS, cursive"
          fontSize="2.4"
          fill="#f5c518"
          opacity="0.85"
        >
          MARIEJOIS
        </text>
      </g>

      {/* Reverse Mountain — 4 ascending currents from each Blue + 1 descending
          peak feeding into Paradise. The canonical "5 pieces" of the
          Reverse Mountain river system. */}
      <g
        transform={`translate(${REVERSE_MOUNTAIN_POS.x} ${REVERSE_MOUNTAIN_POS.y})`}
      >
        {/* Mountain silhouette */}
        <path
          d="M -6 4 L 0 -6 L 6 4 Z"
          fill="var(--color-text)"
          opacity="0.3"
        />
        {/* 4 ascending currents from each Blue cardinal direction */}
        {[
          [-5, 3, -5, -2], // NW current
          [5, 3, 5, -2],   // NE current
          [-5, 8, -5, 4],  // SW current
          [5, 8, 5, 4],    // SE current
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#76cfff"
            strokeWidth="0.4"
            opacity="0.8"
            strokeLinecap="round"
          />
        ))}
        {/* 5th: descending current into Paradise */}
        <line
          x1="-2"
          y1="-4"
          x2="-9"
          y2="6"
          stroke="var(--color-accent)"
          strokeWidth="0.55"
          strokeLinecap="round"
          opacity="0.9"
        />
        <text
          x="0"
          y="-7"
          textAnchor="middle"
          fontFamily="var(--font-luffy, Bangers), Comic Sans MS, cursive"
          fontSize="2"
          fill="var(--color-accent)"
          opacity="0.9"
        >
          REVERSE MTN
        </text>
      </g>

      {/* Sailing route — visited (solid dashed accent) + future (dashed faint) */}
      <path
        d={ROUTE.solid}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="0.6"
        strokeDasharray="1.6 1.0"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d={ROUTE.future}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="0.4"
        strokeDasharray="0.8 1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
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
        "w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden",
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
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${island.file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />
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
        "w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden",
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
      className={[
        "absolute -translate-x-1/2 -translate-y-1/2",
        // Visited + current: full size. Future: smaller + dashed.
        isFuture ? "w-11 h-11 sm:w-11 sm:h-11" : "w-12 h-12 sm:w-14 sm:h-14",
        "rounded-full overflow-hidden",
        "transition-[transform,opacity] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "hover:scale-110 focus-visible:scale-110",
        isCurrent ? "grandline-current-pulse" : "",
      ].join(" ")}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: isFuture ? `2px dashed ${island.color}` : `2px solid ${island.color}`,
        opacity: isFuture && !isActive ? 0.7 : 1,
        boxShadow: isActive
          ? `0 0 24px 6px ${island.color}, inset 0 0 12px rgba(0,0,0,0.5)`
          : isCurrent
          ? `0 0 18px 4px ${island.color}`
          : "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      <img
        src={`${ISLANDS_DIR}/${island.file}.webp`}
        alt=""
        aria-hidden
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
        style={{ filter: isFuture ? "grayscale(60%)" : "none" }}
      />
      <span
        aria-hidden
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-caption font-bold whitespace-nowrap"
        style={{ color: island.color }}
      >
        {island.island}
        {isCurrent ? " ★" : ""}
      </span>
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
