"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isMuted, onMuteChange, playSfx } from "@/shared/lib/audio";

/**
 * Thor-mode ambient storm — subtle thunder flashes at the top of the
 * viewport every 18-35 seconds + two static lightning-bolt SVG silhouettes
 * faintly visible at the edges.
 *
 * Active only on `data-theme="thor"`. Honors prefers-reduced-motion
 * (skips the flash interval; static bolts still render at lower opacity).
 */
export function StormFX() {
  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef<number | null>(null);
  // Subscribe to the mute flag — when the user toggles sound ON, the
  // storm gets MORE INTENSE (faster flashes, bigger glow). Visuals + audio
  // form a single "storm engaged" state, satisfying the user's "when the
  // effects are on we should see the lightning and storm effect" request.
  const muted = useSyncExternalStore(
    (cb) => onMuteChange(() => cb()),
    isMuted,
    () => true
  );
  const intense = active && !muted;

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setActive(el.dataset.theme === "thor");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // Thunder-flash loop — only when theme is thor AND user hasn't requested
  // reduced motion. When sound is unmuted ("storm engaged") the cadence is
  // tighter (3-8s) and flash intensity is dialed up via the `intense` flag
  // that the JSX below reads. When muted: ambient pacing (18-35s).
  useEffect(() => {
    if (!active) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const tick = () => {
      setFlash(true);
      playSfx("thunder");
      window.setTimeout(() => setFlash(false), intense ? 480 : 350);
      const nextInMs = intense
        ? (3 + Math.random() * 5) * 1000  // 3-8s when engaged
        : (18 + Math.random() * 17) * 1000; // 18-35s ambient
      intervalRef.current = window.setTimeout(tick, nextInMs);
    };
    const initialDelay = intense ? 800 + Math.random() * 1200 : 6000 + Math.random() * 6000;
    intervalRef.current = window.setTimeout(tick, initialDelay);
    return () => {
      if (intervalRef.current) window.clearTimeout(intervalRef.current);
    };
  }, [active, intense]);

  if (!active) return null;

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Thunder flash — top of the viewport, fades down. Intensity doubles
          and the flash spreads further when sound is engaged. */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: intense ? "70vh" : "40vh",
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-accent) 75%, white) 0%, transparent 70%)",
          opacity: flash ? (intense ? 0.6 : 0.35) : 0,
          transition: "opacity 90ms ease-out, height 300ms ease",
          mixBlendMode: "screen",
        }}
      />
      {/* Ambient electric glow at the top — always on when "engaged" */}
      {intense && (
        <div
          className="absolute inset-x-0 top-0 h-[20vh]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent)",
            mixBlendMode: "screen",
            animation: "storm-engaged-pulse 2.6s ease-in-out infinite",
          }}
        />
      )}
      {/* Three static lightning bolts at the corners — opacity is boosted in
          engaged mode and a flicker is layered on during a flash. */}
      <svg
        className="absolute left-2 top-4 sm:left-6 sm:top-8"
        width="80"
        height="160"
        viewBox="0 0 80 160"
        style={{
          opacity: intense ? (flash ? 0.95 : 0.55) : 0.25,
          filter: intense ? "drop-shadow(0 0 12px var(--color-accent))" : "none",
          transition: "opacity 90ms ease-out",
        }}
      >
        <path
          d="M 50 0 L 14 80 L 38 80 L 24 160 L 66 64 L 42 64 Z"
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute right-2 top-12 sm:right-6 sm:top-20"
        width="60"
        height="120"
        viewBox="0 0 80 160"
        style={{
          opacity: intense ? (flash ? 0.9 : 0.5) : 0.2,
          filter: intense ? "drop-shadow(0 0 10px var(--color-accent))" : "none",
          transform: "scaleX(-1)",
          transition: "opacity 90ms ease-out",
        }}
      >
        <path
          d="M 50 0 L 14 80 L 38 80 L 24 160 L 66 64 L 42 64 Z"
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          strokeWidth="1"
        />
      </svg>
      {intense && (
        <svg
          className="absolute left-1/2 top-2 -translate-x-1/2"
          width="50"
          height="120"
          viewBox="0 0 80 160"
          style={{
            opacity: flash ? 0.9 : 0.4,
            filter: "drop-shadow(0 0 14px var(--color-accent))",
            transition: "opacity 90ms ease-out",
          }}
        >
          <path
            d="M 50 0 L 14 80 L 38 80 L 24 160 L 66 64 L 42 64 Z"
            fill="var(--color-accent)"
            stroke="var(--color-accent)"
            strokeWidth="1"
          />
        </svg>
      )}
    </div>
  );
}
