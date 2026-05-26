"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

/**
 * Decorative per-theme cast strip — small character icons rendered below
 * the About highlights. No interactivity, purely visual flavour.
 *
 *   Thor   -> Marvel character .ico thumbnails (Avengers cast)
 *   Luffy  -> One-Piece icons + small character art
 *   HighTech -> nothing (clean default)
 *
 * Watches data-theme via MutationObserver so it hot-swaps without reload.
 */

type Item = { src: string; alt: string };

const THOR_CAST: Item[] = [
  { src: "/assets/Marvel/icons/mjolnir.ico", alt: "Mjolnir" },
  { src: "/assets/Marvel/icons/captain-shield.ico", alt: "Captain America" },
  { src: "/assets/Marvel/icons/ironman.ico", alt: "Iron Man" },
  { src: "/assets/Marvel/icons/spiderman.ico", alt: "Spider-Man" },
  { src: "/assets/Marvel/icons/milesmorales.ico", alt: "Miles Morales" },
  { src: "/assets/Marvel/icons/blackpanther.ico", alt: "Black Panther" },
  { src: "/assets/Marvel/icons/deadpool.ico", alt: "Deadpool" },
  { src: "/assets/Marvel/icons/wolverin.ico", alt: "Wolverine" },
  { src: "/assets/Marvel/icons/stan-lee.ico", alt: "Stan Lee" },
];

const LUFFY_CAST: Item[] = [
  { src: "/assets/One-Piece/icons/strawhatflag.ico", alt: "Straw Hat flag" },
  { src: "/assets/One-Piece/icons/luffy.ico", alt: "Luffy" },
  { src: "/assets/One-Piece/nika-symbol@small.webp", alt: "Nika sun" },
];

export function CastStrip() {
  const [theme, setTheme] = useState<"hightech" | "thor" | "luffy">("hightech");

  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const v = el.dataset.theme;
      if (v === "thor" || v === "luffy" || v === "hightech") setTheme(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  if (theme === "hightech") return null;
  const items = theme === "thor" ? THOR_CAST : LUFFY_CAST;

  return (
    <div
      dir="ltr"
      aria-hidden
      className="mt-8 flex items-center justify-center flex-wrap gap-3 sm:gap-4 opacity-80"
    >
      {items.map((it) => (
        <span
          key={it.src}
          className={[
            "inline-block w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden",
            "border border-line bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]",
            "grid place-items-center transition-transform duration-snap ease-snap",
            "hover:scale-110",
          ].join(" ")}
          title={it.alt}
        >
          <img
            src={it.src}
            alt=""
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </span>
      ))}
    </div>
  );
}
