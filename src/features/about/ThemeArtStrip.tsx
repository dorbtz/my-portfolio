"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

/**
 * Per-theme large-character art strip — sits in the About section, below
 * the highlights and chip cast strip, to fill the page with the show's
 * actual artwork (not just tiny icons).
 *
 *   Thor   -> 6 Marvel character PNGs in a horizontal "comic-book line-up"
 *             with halftone backdrop + a wide ASGARDIAN ARCHIVE banner.
 *   Luffy  -> 9 Straw-Hat WANTED posters on a wood-grain board.
 *   HighTech -> nothing (clean default).
 *
 * Both strips horizontally scroll on mobile so the full line-up is reachable
 * without breaking the grid.
 */

const THOR_LINEUP = [
  { src: "/assets/Marvel/thor-almigthy.png", alt: "Thor Almighty" },
  { src: "/assets/Marvel/ironman.png", alt: "Iron Man" },
  { src: "/assets/Marvel/captain-america.png", alt: "Captain America" },
  { src: "/assets/Marvel/spiderman.png", alt: "Spider-Man" },
  { src: "/assets/Marvel/black-widow.png", alt: "Black Widow" },
  { src: "/assets/Marvel/magneto.png", alt: "Magneto" },
];

// Capitalized .png filenames — the high-res replacements the user dropped
// into /public/assets/One-Piece/wanted/ (the lowercase .webp files in the
// same folder are the older lower-res versions, kept around but unused).
const LUFFY_LINEUP = [
  { src: "/assets/One-Piece/wanted/luffy.png", alt: "Wanted: Monkey D. Luffy" },
  { src: "/assets/One-Piece/wanted/Zoro.png", alt: "Wanted: Roronoa Zoro" },
  { src: "/assets/One-Piece/wanted/Nami.png", alt: "Wanted: Nami" },
  { src: "/assets/One-Piece/wanted/Usopp.png", alt: "Wanted: Usopp" },
  { src: "/assets/One-Piece/wanted/Sanji.png", alt: "Wanted: Sanji" },
  { src: "/assets/One-Piece/wanted/Chopper.png", alt: "Wanted: Tony Tony Chopper" },
  { src: "/assets/One-Piece/wanted/Robin.png", alt: "Wanted: Nico Robin" },
  { src: "/assets/One-Piece/wanted/Franky.png", alt: "Wanted: Franky" },
  { src: "/assets/One-Piece/wanted/Brook.png", alt: "Wanted: Brook" },
  { src: "/assets/One-Piece/wanted/Jinbe.png", alt: "Wanted: Jinbe" },
];

export function ThemeArtStrip() {
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

  if (theme === "thor") {
    return (
      <div
        dir="ltr"
        aria-hidden
        className="mt-10 relative rounded-md overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 10%, var(--color-bg-elevated)) 0%, var(--color-bg) 100%), " +
            "radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 50%)",
          border: "1px solid color-mix(in oklab, var(--color-accent) 35%, transparent)",
          boxShadow:
            "inset 0 1px 0 color-mix(in oklab, var(--color-accent) 25%, transparent), 0 24px 64px -16px rgba(0,0,0,0.5)",
        }}
      >
        {/* Halftone Ben-Day overlay for comic-book texture */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--color-accent) 20%, transparent) 1px, transparent 1.4px)",
            backgroundSize: "6px 6px",
            opacity: 0.35,
            mixBlendMode: "screen",
          }}
        />
        <div
          className="relative px-4 py-2 text-caption uppercase tracking-[0.32em]"
          style={{
            background: "color-mix(in oklab, var(--color-accent) 18%, transparent)",
            color: "var(--color-accent)",
            borderBottom: "1px solid color-mix(in oklab, var(--color-accent) 45%, transparent)",
            fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif',
          }}
        >
          {"// ASGARDIAN ARCHIVE · AVENGERS LINE-UP"}
        </div>
        <div className="relative overflow-x-auto no-scrollbar">
          <ul className="flex items-end gap-4 sm:gap-6 px-4 py-5 min-w-fit">
            {THOR_LINEUP.map((it) => (
              <li
                key={it.src}
                className="shrink-0 text-center"
                title={it.alt}
              >
                <img
                  src={it.src}
                  alt=""
                  className="h-32 sm:h-44 w-auto object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 8px 18px rgba(0,0,0,0.45)) drop-shadow(0 0 16px color-mix(in oklab, var(--color-accent) 28%, transparent))",
                  }}
                  loading="lazy"
                />
                <p
                  className="mt-2 text-caption uppercase tracking-[0.18em] text-muted"
                  style={{ fontFamily: 'var(--font-thor, "Bebas Neue"), Impact, sans-serif' }}
                >
                  {it.alt}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Luffy: wanted poster board
  return (
    <div
      dir="ltr"
      aria-hidden
      className="mt-10 relative rounded-md overflow-hidden"
      style={{
        // Aged wood-board look with the manga halftone laid over
        background:
          "repeating-linear-gradient(90deg, #6e4524 0 14px, #5a3818 14px 16px, #6e4524 16px 32px), " +
          "var(--color-bg-elevated)",
        border: "4px solid #1a0d05",
        boxShadow: "6px 6px 0 0 #1a0d05",
      }}
    >
      <div
        className="relative px-4 py-2 text-center font-bold uppercase tracking-[0.16em]"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-accent-contrast)",
          borderBottom: "3px solid #1a0d05",
          fontFamily: 'var(--font-luffy, "Bangers"), "Comic Sans MS", cursive',
          fontSize: "1rem",
          textShadow: "2px 2px 0 #1a0d05",
        }}
      >
        WANTED — DEAD OR ALIVE — STRAW HAT PIRATES
      </div>
      <div className="relative overflow-x-auto no-scrollbar">
        <ul className="flex items-start gap-3 sm:gap-4 px-3 py-4 min-w-fit">
          {LUFFY_LINEUP.map((it, i) => (
            <li
              key={it.src}
              className="shrink-0"
              title={it.alt}
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.4)}deg)` }}
            >
              <img
                src={it.src}
                alt=""
                className="h-36 sm:h-48 w-auto object-contain"
                style={{
                  // Drop-shadow only — no surrounding cream/border, because
                  // each poster brings its own painted parchment. Wrapping
                  // it in a second cream box read as "white border" on the
                  // wood-grain board, which the user wanted off.
                  filter:
                    "drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 2px 2px rgba(0,0,0,0.4))",
                }}
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
