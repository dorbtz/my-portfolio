"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  DAWN_ISLAND,
  ENIES_LOBBY,
  FUTURE_ISLAND_POSITIONS,
  FUTURE_ISLANDS,
  ISLAND_FILES,
  ISLAND_POSITIONS,
  MARY_GEOISE,
  SKILL_DOMAINS,
  type FutureIsland,
  type OriginIsland,
  type SkillDomain,
} from "@/shared/data/skill-domains";
import { MobileZoomPan } from "@/shared/ui/MobileZoomPan";

/**
 * Luffy-mode interactive Grand Line. Uses the canon WORLDMAP.jpeg as the
 * map base and overlays interactive island markers.
 *
 * Interaction model (anchored to the marker, never clips):
 *   - Hover (mouse only)        -> tiny label DIRECTLY ABOVE the marker
 *                                  (rendered as a child of the marker, so
 *                                  it always reads as "attached" to the
 *                                  exact island the cursor is on)
 *   - Click (PC) / Tap (mobile) -> opens a manga-panel card centered on
 *                                  the viewport with a translucent backdrop
 *   - Esc / backdrop / re-click -> closes
 *
 * The wrap uses overflow-visible on its outer so hover labels at the far
 * edges can spill past the rounded map frame (the JPEG itself stays
 * masked to the rounded corners via the inner image wrapper).
 */

const ISLANDS_DIR = "/assets/One-Piece/islands";
const WORLDMAP_SRC = "/assets/One-Piece/WORLDMAP.jpeg";

type CardKind = "visited" | "future" | "origin" | "landmark" | "enies";
type OpenCard = { kind: CardKind; index: number };

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function useCanHover(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(HOVER_QUERY);
      mq.addEventListener?.("change", cb);
      return () => mq.removeEventListener?.("change", cb);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(HOVER_QUERY).matches
        : false,
    () => false
  );
}

function landmarkSrc(island: OriginIsland): string {
  return island.imagePath ?? `${ISLANDS_DIR}/${island.file}.webp`;
}

export function SkillsGrandLine() {
  const [open, setOpen] = useState<OpenCard | null>(null);
  const canHover = useCanHover();

  const close = useCallback(() => setOpen(null), []);
  const toggle = useCallback(
    (kind: CardKind, index: number) =>
      setOpen((prev) => (prev && prev.kind === kind && prev.index === index ? null : { kind, index })),
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    // MobileZoomPan: pinch-zoom + drag on touch devices ONLY (markers stay
    // locked to their painted islands since they're % positioned inside
    // the wrapper — scaling the wrapper scales everything together).
    // Desktop renders children unchanged.
    <MobileZoomPan
      hint="Pinch to zoom · drag to pan"
      resetLabel="Reset map"
      className="grandline-wrap relative w-full rounded-lg border border-line"
      style={{ aspectRatio: "4096 / 2085" }}
    >
      {/* Inner image wrapper handles its OWN rounded mask + overflow-hidden
          so the JPEG stays masked even though the outer wrap is visible. */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={WORLDMAP_SRC}
          alt="One Piece world map (fan-made) — North/South/East/West Blue, Red Line, Calm Belt, Grand Line, and Paradise → New World"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)",
          }}
        />
      </div>

      {/* Marker layer — NOT overflow-hidden, so hover labels can spill. */}
      <div className="absolute inset-0">
        <LandmarkMarker
          island={DAWN_ISLAND}
          variant="dawn"
          canHover={canHover}
          isOpen={open?.kind === "origin"}
          onToggle={() => toggle("origin", 0)}
        />
        <LandmarkMarker
          island={MARY_GEOISE}
          variant="mariejois"
          canHover={canHover}
          isOpen={open?.kind === "landmark"}
          onToggle={() => toggle("landmark", 0)}
        />
        <LandmarkMarker
          island={ENIES_LOBBY}
          variant="enies"
          canHover={canHover}
          isOpen={open?.kind === "enies"}
          onToggle={() => toggle("enies", 0)}
        />
        {SKILL_DOMAINS.map((domain, i) => (
          <VisitedMarker
            key={`v-${domain.island}`}
            domain={domain}
            file={ISLAND_FILES[i]}
            pos={ISLAND_POSITIONS[i]}
            canHover={canHover}
            isOpen={open?.kind === "visited" && open.index === i}
            onToggle={() => toggle("visited", i)}
          />
        ))}
        {/* (visited markers above; the open-card render below passes the
            same ISLAND_FILES entry to VisitedCard for the backdrop image.) */}
        {FUTURE_ISLANDS.map((island, i) => (
          <PostParadiseMarker
            key={`f-${island.island}`}
            island={island}
            pos={FUTURE_ISLAND_POSITIONS[i]}
            canHover={canHover}
            isOpen={open?.kind === "future" && open.index === i}
            onToggle={() => toggle("future", i)}
          />
        ))}
      </div>

      {/* Centered modal card (no clipping possible — viewport-centered) */}
      {open?.kind === "visited" && SKILL_DOMAINS[open.index] && (
        <CardOverlay onClose={close}>
          <VisitedCard
            domain={SKILL_DOMAINS[open.index]}
            file={ISLAND_FILES[open.index]}
            onClose={close}
          />
        </CardOverlay>
      )}
      {open?.kind === "future" && FUTURE_ISLANDS[open.index] && (
        <CardOverlay onClose={close}>
          <FutureCard island={FUTURE_ISLANDS[open.index]} onClose={close} />
        </CardOverlay>
      )}
      {open?.kind === "origin" && (
        <CardOverlay onClose={close}>
          <OriginCard
            island={DAWN_ISLAND}
            accent="#ffc60b"
            onClose={close}
            eyebrow="ORIGIN"
          />
        </CardOverlay>
      )}
      {open?.kind === "landmark" && (
        <CardOverlay onClose={close}>
          <OriginCard
            island={MARY_GEOISE}
            accent="#e8c061"
            onClose={close}
            eyebrow="LANDMARK"
          />
        </CardOverlay>
      )}
      {open?.kind === "enies" && (
        <CardOverlay onClose={close}>
          <OriginCard
            island={ENIES_LOBBY}
            accent="#76cfff"
            onClose={close}
            eyebrow="LANDMARK"
            customBackdrop={<EniesLobbyBackdrop />}
          />
        </CardOverlay>
      )}
    </MobileZoomPan>
  );
}

// ---------- shared overlay + hover label ----------

/** Tiny "name on marker" chip. Rendered as a CHILD of each marker so it
 *  always sits exactly next to whichever island the cursor is on.
 *  `position="below"` is used for islands stacked under another island
 *  (e.g. Jaya, with Skypiea directly above) so the chip doesn't get hidden
 *  behind the neighbour. */
function MarkerLabel({
  text,
  accent,
  position = "above",
}: {
  text: string;
  accent: string;
  position?: "above" | "below";
}) {
  const placement =
    position === "below"
      ? "top-full mt-2"
      : "bottom-full mb-2";
  return (
    <span
      role="presentation"
      className={`absolute left-1/2 ${placement} -translate-x-1/2 px-2 py-1 rounded-md text-caption font-semibold pointer-events-none whitespace-nowrap z-10`}
      style={{
        background: "rgba(15, 23, 42, 0.92)",
        color: "#fff7d6",
        border: `1px solid ${accent}`,
        boxShadow: "0 6px 18px -6px rgba(0,0,0,0.6)",
        fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive',
        letterSpacing: "0.04em",
      }}
    >
      {text}
    </span>
  );
}

function CardOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Portal to <body> so position:fixed escapes the MobileZoomPan transform
  // ancestor. With a CSS transform in the chain, `fixed` resolves to the
  // transformed element's box instead of the viewport — which clipped the
  // card inside the map on mobile (user-reported "card stuck in the map").
  // useSyncExternalStore = hydration-safe "are we on the client?" check
  // without the lint-flagged setState-in-effect pattern.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6"
      style={{ background: "rgba(8, 12, 28, 0.65)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[min(420px,88vw)] sm:max-w-[min(540px,92vw)] max-h-[85dvh] overflow-y-auto"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute top-2 right-2 w-9 h-9 grid place-items-center rounded-full text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_10%,transparent)] transition-colors z-20"
    >
      <span aria-hidden className="text-xl leading-none">×</span>
    </button>
  );
}

// ---------- markers ----------

const MARKER_BASE =
  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full " +
  "transition-[transform,box-shadow] duration-snap ease-snap " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
  "hover:scale-125 focus-visible:scale-125 group ";

type MarkerHandlers = {
  canHover: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

function bindHandlers(h: MarkerHandlers, setHover: (v: boolean) => void) {
  return {
    "aria-expanded": h.isOpen,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      h.onToggle();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        h.onToggle();
      }
    },
    onMouseEnter: () => h.canHover && setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };
}

function LandmarkMarker({
  island,
  variant,
  ...h
}: MarkerHandlers & { island: OriginIsland; variant: "dawn" | "mariejois" | "enies" }) {
  const [hovered, setHovered] = useState(false);
  // Per-variant tinting: warm gold for Dawn (origin), regal gold for
  // Mariejois (Holy Land), icy blue for Enies Lobby (WG steel).
  const accent =
    variant === "dawn" ? "#ffc60b" : variant === "mariejois" ? "#e8c061" : "#76cfff";
  const ring =
    variant === "dawn" ? "#ffc60b" : variant === "mariejois" ? "#d4af37" : "#76cfff";
  return (
    <button
      type="button"
      aria-label={`${island.island} — ${island.sub}`}
      {...bindHandlers(h, setHovered)}
      className={MARKER_BASE + "w-5 h-5 sm:w-10 sm:h-10 overflow-visible"}
      style={{
        left: `${island.pos.x}%`,
        top: `${island.pos.y}%`,
        border: `2px solid ${ring}`,
        background: "transparent",
        boxShadow: h.isOpen
          ? `0 0 16px 6px ${ring}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : `0 0 12px 3px ${ring}b3, 0 0 2px 1px rgba(0,0,0,0.6)`,
      }}
    >
      <span className="block w-full h-full overflow-hidden rounded-full">
        {/* Pangaea-Castle image for Mariejois (downloaded from the canon
            infobox) — same lookup as Dawn / Enies via landmarkSrc, which
            honours imagePath. Crown glyph retired now that we have a real
            picture. */}
        <img
          src={landmarkSrc(island)}
          alt=""
          aria-hidden
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      </span>
      {hovered && h.canHover && <MarkerLabel text={island.island} accent={accent} />}
    </button>
  );
}

function VisitedMarker({
  domain,
  file,
  pos,
  ...h
}: MarkerHandlers & {
  domain: SkillDomain;
  file: string;
  pos: { x: number; y: number; labelBelow?: boolean };
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${domain.island} — ${domain.name}`}
      {...bindHandlers(h, setHovered)}
      className={MARKER_BASE + "w-4 h-4 sm:w-8 sm:h-8 overflow-visible"}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: `2px solid ${domain.color}`,
        boxShadow: h.isOpen
          ? `0 0 16px 6px ${domain.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : `0 0 10px 2px ${domain.color}aa, 0 0 2px 1px rgba(0,0,0,0.6)`,
      }}
    >
      <span className="block w-full h-full overflow-hidden rounded-full">
        <img
          src={`${ISLANDS_DIR}/${file}.webp`}
          alt=""
          aria-hidden
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      </span>
      {hovered && h.canHover && (
        <MarkerLabel
          text={domain.island}
          accent={domain.color}
          position={pos.labelBelow ? "below" : "above"}
        />
      )}
    </button>
  );
}

function PostParadiseMarker({
  island,
  pos,
  ...h
}: MarkerHandlers & {
  island: FutureIsland;
  pos: { x: number; y: number };
}) {
  const [hovered, setHovered] = useState(false);
  const isFuture = island.status === "future";
  const isCurrent = island.status === "current";
  return (
    <button
      type="button"
      aria-label={`${island.island} — ${island.hint}`}
      {...bindHandlers(h, setHovered)}
      className={
        MARKER_BASE +
        (isFuture ? "w-3.5 h-3.5 sm:w-7 sm:h-7 " : "w-4 h-4 sm:w-8 sm:h-8 ") +
        (isCurrent ? "grandline-current-pulse " : "") +
        "overflow-visible"
      }
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        border: isFuture ? `2px dashed ${island.color}` : `2px solid ${island.color}`,
        opacity: isFuture && !h.isOpen ? 0.85 : 1,
        boxShadow: h.isOpen
          ? `0 0 16px 6px ${island.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : isCurrent
          ? `0 0 14px 4px ${island.color}, 0 0 2px 1px rgba(0,0,0,0.6)`
          : `0 0 8px 2px ${island.color}aa, 0 0 2px 1px rgba(0,0,0,0.6)`,
      }}
    >
      <span className="block w-full h-full overflow-hidden rounded-full">
        <img
          src={`${ISLANDS_DIR}/${island.file}.webp`}
          alt=""
          aria-hidden
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          style={{ filter: isFuture ? "grayscale(40%)" : "none" }}
        />
      </span>
      {hovered && h.canHover && <MarkerLabel text={island.island} accent={island.color} />}
    </button>
  );
}

// ---------- cards (manga-panel style) ----------

/** Title strip — sits INSIDE the card padding so the manga banner is fully
 *  visible even when the overlay's `overflow-y-auto` would have clipped a
 *  hanging-off-the-top variant. */
function CardTitleStrip({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      className="absolute top-3 left-3 right-3 px-3 py-1.5 text-center text-caption font-bold uppercase tracking-[0.14em] z-20"
      style={{
        background: accent,
        color: "#1a0d05",
        border: "2px solid #1a0d05",
        fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive',
        letterSpacing: "0.1em",
        fontSize: "0.78rem",
        lineHeight: 1.2,
        wordSpacing: "0.04em",
        boxShadow: "2px 2px 0 0 #1a0d05",
      }}
    >
      {children}
    </div>
  );
}

/** Shared manga-panel shell.  Layers a faded sepia island backdrop under the
 *  cream paper + halftone dots so each card "feels" like the island it
 *  represents without losing the manga look (sepia + opacity 0.2 + cream
 *  wash on top + halftone dots in multiply mode = visible island, intact
 *  manga texture, readable text). */
function MangaCardShell({
  imageSrc,
  customBackdrop,
  borderStyle = "solid",
  shadowAccent = "#1a0d05",
  titleStrip,
  onClose,
  children,
}: {
  imageSrc?: string;
  customBackdrop?: React.ReactNode;
  borderStyle?: "solid" | "dashed";
  shadowAccent?: string;
  titleStrip: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-md overflow-hidden"
      style={{
        background: "#fffaf0",
        color: "#1a0d05",
        border: `3px ${borderStyle} #1a0d05`,
        boxShadow: `6px 6px 0 0 ${shadowAccent}, inset 0 0 0 1px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Layer 1 — island photo backdrop. Higher opacity + lighter sepia so
          the island reads clearly while still feeling like manga-paper. */}
      {imageSrc && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.45,
            filter: "sepia(0.35) saturate(0.85) contrast(1.02)",
          }}
        />
      )}
      {/* Layer 1b — custom backdrop (Mary Geoise palace, Enies Lobby etc.) */}
      {customBackdrop}
      {/* Layer 2 — light cream wash so body text stays legible without
          washing out the island image (was 32/55/85, now 12/26/55). */}
      {(imageSrc || customBackdrop) && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,250,240,0.12) 0%, rgba(255,250,240,0.26) 45%, rgba(255,250,240,0.55) 100%)",
          }}
        />
      )}
      {/* Layer 3 — Ben-Day halftone dots in multiply blend (manga texture) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(26,13,5,0.10) 1px, transparent 2px), " +
            "radial-gradient(circle at 70% 80%, rgba(26,13,5,0.08) 1px, transparent 2px)",
          backgroundSize: "24px 24px, 31px 31px",
          mixBlendMode: "multiply",
        }}
      />
      {titleStrip}
      <CloseBtn onClose={onClose} />
      {/* Content — pushed below the title strip via pt-14 so the banner is
          always fully visible (was hanging off the top w/ -top-3 and got
          clipped by the overlay's overflow-y-auto). */}
      <div className="relative z-10 p-5 sm:p-6 pt-14">{children}</div>
    </div>
  );
}

function VisitedCard({
  domain,
  file,
  onClose,
}: {
  domain: SkillDomain;
  file: string;
  onClose: () => void;
}) {
  return (
    <MangaCardShell
      imageSrc={`${ISLANDS_DIR}/${file}.webp`}
      titleStrip={
        <CardTitleStrip accent={domain.color}>
          {domain.gear} · {domain.island}
        </CardTitleStrip>
      }
      onClose={onClose}
    >
      <p
        className="text-h3 font-bold leading-tight"
        style={{ fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive', color: "#1a0d05" }}
      >
        {domain.name}
      </p>
      <p className="text-caption italic mt-1" style={{ color: "#5a3818" }}>
        {domain.lore}
      </p>
      <ul className="mt-4 grid gap-1.5">
        {domain.children.map((s) => (
          <li key={s.name} className="text-body-sm" style={{ color: "#1a0d05" }}>
            <span className="font-bold">{s.name}</span>{" "}
            <span style={{ color: "#5a3818" }}>— {s.description}</span>
          </li>
        ))}
      </ul>
    </MangaCardShell>
  );
}

function FutureCard({ island, onClose }: { island: FutureIsland; onClose: () => void }) {
  const statusLabel =
    island.status === "current" ? "Current arc" : island.status === "future" ? "Future" : "Visited";
  return (
    <MangaCardShell
      imageSrc={`${ISLANDS_DIR}/${island.file}.webp`}
      borderStyle={island.status === "future" ? "dashed" : "solid"}
      titleStrip={
        <CardTitleStrip accent={island.color}>
          {island.gear} · {statusLabel}
        </CardTitleStrip>
      }
      onClose={onClose}
    >
      <p
        className="text-h3 font-bold leading-tight"
        style={{ fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive', color: "#1a0d05" }}
      >
        {island.island}
      </p>
      <p className="text-caption italic mt-1" style={{ color: "#5a3818" }}>
        {island.lore}
      </p>
      <p className="text-body-sm mt-3" style={{ color: "#1a0d05" }}>
        — {island.hint}
      </p>
    </MangaCardShell>
  );
}

function OriginCard({
  island,
  accent,
  eyebrow,
  customBackdrop,
  onClose,
}: {
  island: OriginIsland;
  accent: string;
  eyebrow: string;
  customBackdrop?: React.ReactNode;
  onClose: () => void;
}) {
  // If a customBackdrop is supplied (Mary Geoise / Enies Lobby), skip the
  // image lookup — otherwise build it from imagePath or the islands dir.
  const imageSrc = customBackdrop
    ? undefined
    : island.imagePath ?? `${ISLANDS_DIR}/${island.file}.webp`;
  return (
    <MangaCardShell
      imageSrc={imageSrc}
      customBackdrop={customBackdrop}
      shadowAccent={accent}
      titleStrip={
        <CardTitleStrip accent={accent}>
          {eyebrow} · {island.sub}
        </CardTitleStrip>
      }
      onClose={onClose}
    >
      <p
        className="text-h3 font-bold leading-tight"
        style={{ fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive', color: "#1a0d05" }}
      >
        {island.island}
      </p>
      <p className="text-caption italic mt-1" style={{ color: "#5a3818" }}>
        {island.lore}
      </p>
      <div className="mt-4 grid gap-3">
        {island.sections.map((s) => (
          <div key={s.title}>
            <p className="text-body-sm font-bold" style={{ color: "#1a0d05" }}>
              {s.title}
            </p>
            <p className="text-caption mt-0.5" style={{ color: "#5a3818" }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </MangaCardShell>
  );
}

// ---------- custom backdrops (composited in CSS/SVG, no external download) ----------

/** Enies Lobby — uses the WG icon as a centered watermark on a navy/steel
 *  gradient backdrop (judicial-island palette). */
function EniesLobbyBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {/* Steel-blue radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(118, 207, 255, 0.35) 0%, rgba(60, 100, 160, 0.18) 50%, transparent 80%)",
        }}
      />
      {/* WG building icon, centered, faded */}
      <div className="absolute inset-0 grid place-items-center">
        <img
          src="/assets/One-Piece/icons/enies-lobby-map-icon-transparent.png"
          alt=""
          aria-hidden
          className="max-w-[55%] max-h-[55%] object-contain"
          style={{ opacity: 0.35, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}
        />
      </div>
    </div>
  );
}
