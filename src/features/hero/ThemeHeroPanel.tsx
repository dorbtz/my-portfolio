"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

/**
 * Per-theme decorative hero panel — rendered below the Hero CTAs.
 *   Luffy  -> full manga panel with Gum-Gum Devil Fruit centerpiece
 *             (Ben-Day dots, speed lines, Sun-God Nika rays, clouds,
 *              kana SFX text, manga panel border) — ported 1:1 from v1
 *              (legacy/src/features/hero/Hero.tsx MangaHero) for the
 *              "beautiful" treatment the user remembered.
 *   Thor   -> Mjolnir on a Bifrost-shimmer disc with rune corners +
 *             two crossing lightning streaks.
 *   HighTech -> nothing (default theme stays clean / minimal).
 *
 * Watches `data-theme` via MutationObserver so it hot-swaps with the
 * switcher. Honors prefers-reduced-motion by halting the bob / spin
 * animations via the inline keyframes' reduced-motion overrides.
 */

export function ThemeHeroPanel() {
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

  return (
    <div className="mx-auto mt-8 w-full max-w-[min(560px,92vw)]" aria-hidden>
      {/* Inline keyframes — kept local so the panel is self-contained */}
      <style>{`
        @keyframes hero-fruit-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes hero-sun-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hero-mjolnir-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes hero-bifrost-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fruit-bob, .hero-sun-spin, .hero-mjolnir-float, .hero-bifrost-spin {
            animation: none !important;
          }
        }
      `}</style>

      {theme === "luffy" ? <MangaPanel /> : <ThorPanel />}
    </div>
  );
}

// ============================================================
// Luffy — Manga panel with Gum-Gum Devil Fruit centerpiece
// ============================================================
function MangaPanel() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md"
      style={{ aspectRatio: "5 / 3", minHeight: 280 }}
    >
      {/* Layer 1 — Cream manga paper + sky gradient */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 70% at 50% 38%, rgba(255,235,200,0.95) 0%, rgba(255,210,180,0.75) 45%, rgba(255,180,210,0.45) 75%, rgba(180,210,250,0.35) 100%)",
        }}
      />

      {/* Layer 2 — Ben-Day halftone dots */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(140, 60, 30, 0.18) 1.2px, transparent 1.4px)",
          backgroundSize: "7px 7px",
          mixBlendMode: "multiply",
          opacity: 0.7,
        }}
      />

      {/* Layer 3 — Radial speed lines */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.55, mixBlendMode: "multiply" }}
      >
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = (i * 360) / 28;
          const rad = (angle * Math.PI) / 180;
          const cx = 200,
            cy = 200;
          const r1 = 90 + (i % 3) * 14;
          const r2 = 200 + (i % 4) * 20;
          return (
            <line
              key={i}
              x1={cx + Math.cos(rad) * r1}
              y1={cy + Math.sin(rad) * r1}
              x2={cx + Math.cos(rad) * r2}
              y2={cy + Math.sin(rad) * r2}
              stroke="#1a0d05"
              strokeWidth={i % 4 === 0 ? 2.4 : 1.2}
              strokeLinecap="round"
              opacity={0.55}
            />
          );
        })}
      </svg>

      {/* Layer 4 — Sun God Nika golden rays */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full hero-sun-spin"
        style={{ mixBlendMode: "screen", animation: "hero-sun-spin 32s linear infinite" }}
      >
        <defs>
          <radialGradient id="hero-nika-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ffd766" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff9933" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="url(#hero-nika-glow)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          const rad = (angle * Math.PI) / 180;
          return (
            <polygon
              key={i}
              points={`${200 + Math.cos(rad) * 70},${200 + Math.sin(rad) * 70} ${
                200 + Math.cos(rad - 0.06) * 200
              },${200 + Math.sin(rad - 0.06) * 200} ${200 + Math.cos(rad + 0.06) * 200},${
                200 + Math.sin(rad + 0.06) * 200
              }`}
              fill="rgba(255, 215, 70, 0.42)"
            />
          );
        })}
      </svg>

      {/* Layer 5 — Cloud silhouettes */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.85 }}
      >
        <ellipse cx="80" cy="320" rx="70" ry="22" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="140" cy="335" rx="50" ry="18" fill="rgba(255,255,255,0.75)" />
        <ellipse cx="320" cy="310" rx="80" ry="26" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="260" cy="335" rx="55" ry="18" fill="rgba(255,255,255,0.75)" />
      </svg>

      {/* Layer 6 — Devil Fruit centerpiece */}
      <div className="absolute inset-0 grid place-items-center">
        <img
          src="/assets/One-Piece/Gomu-Gomu-no-Mi-One-Piece-Devil-Fruit-415.webp"
          alt="Gomu Gomu no Mi — the Sun God Devil Fruit"
          className="hero-fruit-bob"
          style={{
            width: "clamp(120px, 32%, 200px)",
            height: "auto",
            objectFit: "contain",
            filter:
              "drop-shadow(0 8px 28px rgba(255, 100, 30, 0.6)) drop-shadow(0 0 18px rgba(255, 215, 70, 0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
            animation: "hero-fruit-bob 4.5s ease-in-out infinite",
            position: "relative",
            zIndex: 2,
          }}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Layer 7 — Kana SFX text scattered */}
      <span
        aria-hidden
        className="absolute"
        style={{
          top: "10%",
          left: "6%",
          fontFamily: 'var(--font-luffy, "Bangers", "Bebas Neue"), sans-serif',
          fontSize: "clamp(28px, 5vw, 44px)",
          color: "#d11b1b",
          textShadow: "3px 3px 0 #fff, 4px 4px 0 #1a0d05",
          transform: "rotate(-12deg)",
          letterSpacing: "0.05em",
        }}
      >
        ドン!
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{
          top: "14%",
          right: "5%",
          fontFamily: 'var(--font-luffy, "Bangers", "Bebas Neue"), sans-serif',
          fontSize: "clamp(22px, 4vw, 36px)",
          color: "#1a0d05",
          textShadow: "2px 2px 0 #ffd766",
          transform: "rotate(8deg)",
        }}
      >
        ゴムゴム!
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{
          bottom: "22%",
          left: "5%",
          fontFamily: 'var(--font-luffy, "Bangers", "Bebas Neue"), sans-serif',
          fontSize: "clamp(20px, 3.5vw, 30px)",
          color: "#1a0d05",
          textShadow: "2px 2px 0 #fff",
          transform: "rotate(-6deg)",
        }}
      >
        ボン!
      </span>

      {/* Layer 8 — One-Piece logo watermark */}
      <img
        src="/assets/One-Piece/One-Piece-Logo-1416.webp"
        alt=""
        aria-hidden
        className="absolute"
        style={{
          bottom: 12,
          right: 12,
          width: 90,
          opacity: 0.85,
          pointerEvents: "none",
          zIndex: 2,
        }}
        loading="lazy"
      />

      {/* Layer 9 — Manga panel border (thick black double stroke) */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          border: "4px solid #1a0d05",
          boxShadow: "inset 0 0 0 2px #fffaf0, inset 0 0 0 6px #1a0d05",
        }}
      />
    </div>
  );
}

// ============================================================
// Thor — Mjolnir + Bifrost disc + crossing lightning
// ============================================================
function ThorPanel() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md"
      style={{
        aspectRatio: "5 / 3",
        minHeight: 280,
        background:
          "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(76, 207, 255, 0.32) 0%, rgba(180, 70, 255, 0.18) 45%, rgba(8, 12, 28, 0.9) 100%)",
        border: "1px solid color-mix(in oklab, var(--color-accent) 40%, transparent)",
        boxShadow: "0 24px 64px -16px rgba(0,0,0,0.6), 0 0 32px -8px var(--color-accent)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, rgba(255, 215, 0, 0.18), transparent 45%), " +
            "radial-gradient(circle at 80% 75%, rgba(76, 207, 255, 0.22), transparent 50%)",
        }}
      />

      {/* Bifrost shimmer ring */}
      <span
        aria-hidden
        className="absolute hero-bifrost-spin"
        style={{
          left: "50%",
          top: "50%",
          width: 320,
          height: 320,
          marginLeft: -160,
          marginTop: -160,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, #ff5050, #ffa500, #ffd700, #4ccfff, #b446ff, #ff50c8, #ff5050)",
          filter: "blur(28px)",
          opacity: 0.55,
          animation: "hero-bifrost-spin 18s linear infinite",
        }}
      />

      {/* Rune corners */}
      <span
        aria-hidden
        className="absolute"
        style={{
          top: 14,
          left: 18,
          fontSize: 22,
          color: "rgba(240, 215, 122, 0.6)",
          textShadow: "0 0 12px rgba(76, 207, 255, 0.6)",
          letterSpacing: "0.18em",
        }}
      >
        ᚦᛟᚱ
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{
          top: 14,
          right: 18,
          fontSize: 22,
          color: "rgba(118, 207, 255, 0.6)",
          textShadow: "0 0 12px rgba(240, 215, 122, 0.55)",
          letterSpacing: "0.18em",
        }}
      >
        ᛗᛃᛟᛚ
      </span>

      {/* Mjolnir centerpiece */}
      <div className="absolute inset-0 grid place-items-center">
        <img
          src="/assets/Marvel/mjolnir.png"
          alt="Mjolnir, the hammer of Thor"
          className="hero-mjolnir-float"
          style={{
            width: "clamp(140px, 30%, 220px)",
            height: "auto",
            objectFit: "contain",
            filter:
              "drop-shadow(0 0 18px rgba(255, 215, 0, 0.65)) drop-shadow(0 0 36px rgba(76, 207, 255, 0.55)) drop-shadow(0 8px 22px rgba(0, 0, 0, 0.6))",
            animation: "hero-mjolnir-float 4.5s ease-in-out infinite",
            position: "relative",
            zIndex: 2,
          }}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Crossing lightning bolts */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: 0.55 }}
      >
        <path
          d="M 80 60 L 130 180 L 100 200 L 160 320"
          stroke="#76cfff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 320 90 L 280 200 L 310 220 L 260 330"
          stroke="#ffd700"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
