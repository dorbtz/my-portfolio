"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setActive(el.dataset.theme === "thor");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // Thunder-flash loop — only when theme is thor AND user hasn't requested
  // reduced motion.
  useEffect(() => {
    if (!active) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const tick = () => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 350);
      const nextInMs = (18 + Math.random() * 17) * 1000;
      intervalRef.current = window.setTimeout(tick, nextInMs);
    };
    intervalRef.current = window.setTimeout(tick, 6000 + Math.random() * 6000);
    return () => {
      if (intervalRef.current) window.clearTimeout(intervalRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Thunder flash — top of the viewport, fades down */}
      <div
        className="absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background: "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-accent) 65%, white) 0%, transparent 70%)",
          opacity: flash ? 0.35 : 0,
          transition: "opacity 90ms ease-out",
          mixBlendMode: "screen",
        }}
      />
      {/* Two static lightning bolts at the upper corners */}
      <svg
        className="absolute left-2 top-4 sm:left-6 sm:top-8 opacity-25"
        width="80"
        height="160"
        viewBox="0 0 80 160"
      >
        <path
          d="M 50 0 L 14 80 L 38 80 L 24 160 L 66 64 L 42 64 Z"
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute right-2 top-12 sm:right-6 sm:top-20 opacity-20 flip-rtl"
        width="60"
        height="120"
        viewBox="0 0 80 160"
        style={{ transform: "scaleX(-1)" }}
      >
        <path
          d="M 50 0 L 14 80 L 38 80 L 24 160 L 66 64 L 42 64 Z"
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
