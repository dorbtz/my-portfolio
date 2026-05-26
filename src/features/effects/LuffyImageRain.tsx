"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

/**
 * Luffy-mode atmospheric rain — small character + emblem images drift
 * from the top of the viewport to below it on staggered loops. Sits
 * behind page content (z-0, pointer-events-none) so it never blocks
 * interaction.
 *
 * Active only on `data-theme="luffy"`. Honors prefers-reduced-motion.
 * Single MutationObserver mount keeps this near-zero cost when inactive.
 */

const ASSETS = [
  "/assets/One-Piece/nika-symbol@small.webp",
  "/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image@small.webp",
  "/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453@small.webp",
  "/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105@small.webp",
  "/assets/One-Piece/Portgas-D-Ace-One-Piece-4523@small.webp",
];

type Drop = {
  src: string;
  left: number;   // 0-100 %
  size: number;   // px
  delay: number;  // s
  duration: number; // s
};

function makeDrops(count = 12): Drop[] {
  const drops: Drop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      src: ASSETS[i % ASSETS.length],
      left: Math.round((i / (count - 1)) * 92 + 4 + (Math.random() * 6 - 3)),
      size: 36 + Math.round(Math.random() * 24), // 36-60 px
      delay: Math.round(Math.random() * 12 * 10) / 10, // 0-12s
      duration: 18 + Math.round(Math.random() * 14), // 18-32s
    });
  }
  return drops;
}

export function LuffyImageRain() {
  const [active, setActive] = useState(false);
  const [drops] = useState<Drop[]>(() => makeDrops(12));

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setActive(el.dataset.theme === "luffy");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ contain: "layout paint" }}
    >
      {drops.map((d, i) => (
        <img
          key={i}
          src={d.src}
          alt=""
          className="luffy-rain-drop absolute"
          style={{
            left: `${d.left}%`,
            top: -d.size,
            width: d.size,
            height: d.size,
            objectFit: "contain",
            animation: `luffy-rain-fall ${d.duration}s linear ${d.delay}s infinite`,
            opacity: 0.18,
          }}
          loading="lazy"
        />
      ))}
    </div>
  );
}
