"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isMuted, onMuteChange, playSfx } from "@/shared/lib/audio";

/**
 * Thor-mode live storm — forked lightning bolts strike at random across the
 * viewport, paired with a full-sky flash and thunder. The strike is
 * procedurally generated each fire (random root X, jittered zig-zag path,
 * 0-3 forks branching off) so no two look alike.
 *
 *   Muted (default)    -> ambient pacing, slower flashes (12-20s), silent.
 *   Unmuted ("engaged") -> intense pacing (2-6s), full sky flash + thunder
 *                          sound on each strike.
 *
 * Active only on `data-theme="thor"`. Honors prefers-reduced-motion (only
 * the static corner glow remains; no strikes, no flash).
 */

const VIEWBOX_W = 1000;
const VIEWBOX_H = 1000;

type Bolt = {
  id: number;
  path: string;
  branches: string[];
  rootX: number; // 0–1000 in viewBox space
  bornAt: number;
};

const BOLT_LIFETIME_MS = 420;

/**
 * Generate a single forked lightning path in a 1000×1000 viewBox.
 * Starts at (rootX, 0), zig-zags downward to ~1000, with optional branches.
 */
function generateBolt(rootX: number): { path: string; branches: string[] } {
  const segments = 14 + Math.floor(Math.random() * 6); // 14–19 zig-zag steps
  const segH = VIEWBOX_H / segments;
  const points: { x: number; y: number }[] = [{ x: rootX, y: 0 }];
  let x = rootX;
  for (let i = 1; i <= segments; i++) {
    x += (Math.random() - 0.5) * 90; // ±45 px horizontal jitter
    x = Math.max(20, Math.min(VIEWBOX_W - 20, x));
    points.push({ x, y: i * segH });
  }
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // 0–3 small branches that fork off mid-bolt for ~3–5 segments
  const branchCount = Math.floor(Math.random() * 4);
  const branches: string[] = [];
  for (let b = 0; b < branchCount; b++) {
    const startIdx = 3 + Math.floor(Math.random() * (segments - 6));
    const start = points[startIdx];
    if (!start) continue;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const branchLen = 3 + Math.floor(Math.random() * 3);
    let bx = start.x;
    let by = start.y;
    const branchPts = [`M${bx.toFixed(1)},${by.toFixed(1)}`];
    for (let i = 0; i < branchLen; i++) {
      bx += dir * (30 + Math.random() * 40);
      by += 30 + Math.random() * 30;
      bx = Math.max(0, Math.min(VIEWBOX_W, bx));
      by = Math.min(VIEWBOX_H, by);
      branchPts.push(`L${bx.toFixed(1)},${by.toFixed(1)}`);
    }
    branches.push(branchPts.join(" "));
  }
  return { path, branches };
}

export function StormFX() {
  const [active, setActive] = useState(false);
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [flash, setFlash] = useState(false);
  const idRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  // Subscribe to the music-mute flag — sound ON = "engaged" storm
  // (much faster strikes + audible thunder); sound OFF = ambient strikes
  // (visual only, slower cadence).
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

  // Strike loop — fires a single bolt (sometimes a quick 2-strike chain
  // in intense mode) on a randomized interval. Each bolt auto-clears after
  // its lifetime; flash overlay pulses on strike.
  useEffect(() => {
    if (!active) return;
    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const fireOne = () => {
      const rootX = 80 + Math.random() * (VIEWBOX_W - 160);
      const { path, branches } = generateBolt(rootX);
      const id = ++idRef.current;
      const bornAt = performance.now();
      setBolts((cur) => [...cur, { id, path, branches, rootX, bornAt }]);
      setFlash(true);
      if (intense) playSfx("thunder");
      window.setTimeout(() => setFlash(false), intense ? 110 : 80);
      window.setTimeout(() => {
        setBolts((cur) => cur.filter((b) => b.id !== id));
      }, BOLT_LIFETIME_MS);
    };

    const tick = () => {
      fireOne();
      // 30 % chance of an instant follow-up strike when engaged
      if (intense && Math.random() < 0.3) {
        window.setTimeout(fireOne, 140 + Math.random() * 180);
      }
      const nextMs = intense
        ? (2 + Math.random() * 4) * 1000 // 2–6 s engaged
        : (12 + Math.random() * 8) * 1000; // 12–20 s ambient
      timeoutRef.current = window.setTimeout(tick, nextMs);
    };

    const initialDelay = intense ? 500 + Math.random() * 800 : 4000 + Math.random() * 3000;
    timeoutRef.current = window.setTimeout(tick, initialDelay);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [active, intense]);

  if (!active) return null;

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Sky flash — full-viewport white wash that pulses on each strike,
          stronger in engaged mode. mix-blend-mode: screen so it brightens
          the page without washing out content. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--color-accent) 60%, white) 0%, transparent 65%)",
          opacity: flash ? (intense ? 0.55 : 0.32) : 0,
          transition: "opacity 80ms ease-out",
          mixBlendMode: "screen",
        }}
      />
      {/* Ambient electric haze at the top — only when engaged. */}
      {intense && (
        <div
          className="absolute inset-x-0 top-0 h-[18vh]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent)",
            mixBlendMode: "screen",
            animation: "storm-engaged-pulse 2.6s ease-in-out infinite",
          }}
        />
      )}
      {/* The strikes — one SVG covers the whole viewport in a 1000×1000
          viewBox stretched non-uniformly to the screen. Each <Bolt /> is
          a polyline with a bright core + an outer glow stroke. */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="none"
        style={{ mixBlendMode: "screen" }}
      >
        <defs>
          <filter id="storm-bolt-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>
        {bolts.map((b) => (
          <BoltShape key={b.id} bolt={b} />
        ))}
      </svg>
    </div>
  );
}

function BoltShape({ bolt }: { bolt: Bolt }) {
  // Quick CSS fade-out via opacity transition. The bolt enters at full
  // brightness then fades over its lifetime so it reads as a strike + decay.
  const accent = "var(--color-accent)";
  return (
    <g style={{ animation: `storm-bolt-fade ${BOLT_LIFETIME_MS}ms ease-out forwards` }}>
      {/* Outer glow halo */}
      <path
        d={bolt.path}
        fill="none"
        stroke={accent}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
        filter="url(#storm-bolt-glow)"
      />
      {/* Bright white core */}
      <path
        d={bolt.path}
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {bolt.branches.map((d, i) => (
        <g key={i}>
          <path
            d={d}
            fill="none"
            stroke={accent}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.45}
            filter="url(#storm-bolt-glow)"
          />
          <path
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
}
