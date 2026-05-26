"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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
 * Interaction model (anchored to the marker, never clips):
 *   - Hover (mouse only)        -> tiny realm-name label DIRECTLY ABOVE the
 *                                  star — rendered as a child of the star
 *                                  so it always reads as "attached" to the
 *                                  exact realm the cursor is on.
 *   - Click (PC) / Tap (mobile) -> opens an MCU-dossier card centered on
 *                                  the viewport with a translucent backdrop.
 *   - Esc / backdrop / re-click -> closes.
 */

const YGGDRASIL_BG = "/assets/Marvel/skills/YGGDRASIL-transparent.png";

type CardKind = "visited" | "future";
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

export function SkillsYggdrasil() {
  const [open, setOpen] = useState<OpenCard | null>(null);
  const [bgFailed, setBgFailed] = useState(false);
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
        {SKILL_DOMAINS.map((domain, i) => (
          <RealmStar
            key={`v-${domain.realm}`}
            domain={domain}
            pos={REALM_STARS[i]}
            canHover={canHover}
            isOpen={open?.kind === "visited" && open.index === i}
            onToggle={() => toggle("visited", i)}
          />
        ))}
        {FUTURE_REALMS.map((realm, i) => (
          <FutureStar
            key={`f-${realm.realm}`}
            realm={realm}
            pos={FUTURE_REALM_STARS[i]}
            canHover={canHover}
            isOpen={open?.kind === "future" && open.index === i}
            onToggle={() => toggle("future", i)}
          />
        ))}
      </div>

      {open?.kind === "visited" && SKILL_DOMAINS[open.index] && (
        <CardOverlay onClose={close}>
          <VisitedCard domain={SKILL_DOMAINS[open.index]} onClose={close} />
        </CardOverlay>
      )}
      {open?.kind === "future" && FUTURE_REALMS[open.index] && (
        <CardOverlay onClose={close}>
          <FutureCard realm={FUTURE_REALMS[open.index]} onClose={close} />
        </CardOverlay>
      )}
    </div>
  );
}

// ---------- shared overlay + hover label ----------

/** Realm-name chip rendered as a CHILD of the star — sits directly above
 *  the star with a small gap, attaches visually no matter where on the
 *  viewport the star happens to be. */
function StarLabel({ text, accent }: { text: string; accent: string }) {
  return (
    <span
      role="presentation"
      className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 px-2 py-1 rounded-md text-caption font-semibold pointer-events-none whitespace-nowrap z-10"
      style={{
        background: "rgba(8, 12, 28, 0.92)",
        color: accent,
        border: `1px solid ${accent}`,
        boxShadow: `0 6px 18px -6px rgba(0,0,0,0.6), 0 0 12px -4px ${accent}`,
        fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
}

function CardOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    // skill-card-overlay class is targeted by globals.css to drop the dark
    // backdrop + blur on Thor + light mode (per user request — the dark
    // overlay clashes with the bright theme; the card alone reads cleaner).
    <div
      className="skill-card-overlay fixed inset-0 z-[90] grid place-items-center p-4 sm:p-6"
      style={{ background: "rgba(8, 12, 28, 0.7)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[min(540px,92vw)] max-h-[88dvh] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute top-2 right-2 w-9 h-9 grid place-items-center rounded-full text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_10%,transparent)] transition-colors z-10"
    >
      <span aria-hidden className="text-xl leading-none">×</span>
    </button>
  );
}

// ---------- stars ----------

type StarHandlers = {
  canHover: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

function bindStarHandlers(h: StarHandlers, setHover: (v: boolean) => void) {
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

function RealmStar({
  domain,
  pos,
  ...h
}: StarHandlers & {
  domain: SkillDomain;
  pos: StarPos;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${domain.realm} — ${domain.name}`}
      {...bindStarHandlers(h, setHovered)}
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
        boxShadow: h.isOpen
          ? `0 0 24px 6px ${domain.color}, inset 0 0 12px ${domain.color}`
          : `0 0 12px 2px color-mix(in oklab, ${domain.color} 40%, transparent)`,
      }}
    >
      {domain.realm.charAt(0)}
      {hovered && h.canHover && <StarLabel text={domain.realm} accent={domain.color} />}
    </button>
  );
}

function FutureStar({
  realm,
  pos,
  ...h
}: StarHandlers & {
  realm: FutureRealm;
  pos: StarPos;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${realm.realm} — ${realm.hint}`}
      {...bindStarHandlers(h, setHovered)}
      className={[
        "absolute -translate-x-1/2 -translate-y-1/2",
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
        opacity: h.isOpen ? 1 : 0.7,
        boxShadow: h.isOpen ? `0 0 16px 4px ${realm.color}` : "none",
      }}
    >
      {hovered && h.canHover && <StarLabel text={realm.realm} accent={realm.color} />}
    </button>
  );
}

// ---------- cards (MCU dossier style) ----------

function VisitedCard({ domain, onClose }: { domain: SkillDomain; onClose: () => void }) {
  return (
    <div
      className="relative rounded-md p-5 sm:p-6"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--color-bg-elevated) 100%, transparent), color-mix(in oklab, var(--color-bg) 100%, transparent))",
        border: `1px solid color-mix(in oklab, ${domain.color} 60%, transparent)`,
        boxShadow: `inset 0 1px 0 color-mix(in oklab, ${domain.color} 30%, transparent), 0 24px 64px -16px rgba(0,0,0,0.6), 0 0 32px -8px ${domain.color}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 px-4 py-2 text-caption uppercase tracking-[0.32em]"
        style={{
          background: `linear-gradient(90deg, color-mix(in oklab, ${domain.color} 25%, transparent), color-mix(in oklab, ${domain.color} 6%, transparent) 60%, transparent)`,
          color: domain.color,
          borderBottom: `1px solid color-mix(in oklab, ${domain.color} 40%, transparent)`,
          fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
        }}
      >
        {"// ASGARDIAN ARCHIVE · "}{domain.realm}
      </div>
      <CloseBtn onClose={onClose} />
      <div className="mt-10">
        <p
          className="text-h3 font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
            color: "var(--color-text)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {domain.name}
        </p>
        <p className="text-caption text-muted italic mt-1">{domain.lore}</p>
        <ul className="mt-4 grid gap-1.5">
          {domain.children.map((s) => (
            <li key={s.name} className="text-body-sm text-fg">
              <span className="font-semibold">{s.name}</span>{" "}
              <span className="text-muted">— {s.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        aria-hidden
        className="absolute left-4 right-4 bottom-3 h-px"
        style={{
          background: `repeating-linear-gradient(90deg, ${domain.color} 0 8px, transparent 8px 14px)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

function FutureCard({ realm, onClose }: { realm: FutureRealm; onClose: () => void }) {
  return (
    <div
      className="relative rounded-md p-5 sm:p-6"
      style={{
        background: "var(--color-bg-elevated)",
        border: `1px dashed ${realm.color}`,
        boxShadow: `0 16px 48px -16px ${realm.color}66`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 px-4 py-2 text-caption uppercase tracking-[0.32em]"
        style={{
          background: `linear-gradient(90deg, color-mix(in oklab, ${realm.color} 20%, transparent), transparent)`,
          color: realm.color,
          borderBottom: `1px dashed ${realm.color}`,
          fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
        }}
      >
        {"// MULTIVERSE · "}{realm.tier}
      </div>
      <CloseBtn onClose={onClose} />
      <div className="mt-10">
        <p
          className="text-h3 font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
            color: "var(--color-text)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {realm.realm}
        </p>
        <p className="text-caption text-muted italic mt-1">{realm.lore}</p>
        <p className="text-body-sm text-muted mt-3">— {realm.hint}</p>
      </div>
    </div>
  );
}
