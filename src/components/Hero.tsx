/**
 * src/components/Hero.tsx
 * Mode-aware hero — ONE focal 3D/visual region per mode.
 *
 * Thor mode:
 *   - Full-width <HeroModel> (static MCU composition: Marvel logo + Mjolnir + lightning).
 *   - Click → thunder + GSAP Y-lift.
 *
 * Gear 5 mode:
 *   - Devil Fruit image on a stylized cloud background + Gear 5 Luffy foreground.
 *   - Click → gear5:awaken event + playSfx('drums.liberation').
 *
 * Crossfade: 320ms opacity + scale transition when mode toggles.
 * Respects reducedMotion → instant swap.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Section from './Section';
import { useMode, useMotionOn, useEffectsActive, useModeStore } from '../stores/mode';
import { useCapability } from '../hooks/useCapability';
import { useViewTransitionNav } from '../lib/navigate';
import { listProjects } from '../services/projects';
import { filterProjectsByMode, getFixturesForMode } from '../data/project-fixtures';
import { playSfx, stopSfx } from '../lib/audio';
import { gsap } from '../lib/gsap';
import { useSiteContent } from '../features/content/hooks/useSiteContent';
import { PORTFOLIO } from '../lib/portfolioConfig';
import type { Project } from '../types/project';

// --------------------------------------------------------------------------
// HeroModel — Thor mode hero visual (static MCU image, perf-friendly)
//
// The R3F Mjolnir scene was removed in this revision: even after the perf
// pass the canvas + post-processing stack ran noticeably slower than the
// Luffy mode static visual on mid-tier hardware. We replace it with a
// composed static treatment — Marvel logo + Mjolnir silhouette + lightning
// halo — that costs nothing at runtime and keeps the cinematic feel.
// --------------------------------------------------------------------------
function HeroModel({ className }: { className?: string }) {
  return (
    <div
      className={className ?? 'h-[420px] w-full rounded-[28px]'}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 28,
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(76, 207, 255, 0.32) 0%, rgba(180, 70, 255, 0.18) 45%, rgba(8, 12, 28, 0.9) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Cosmic backdrop: layered radial highlights */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 25%, rgba(255, 215, 0, 0.18), transparent 45%), ' +
            'radial-gradient(circle at 80% 75%, rgba(76, 207, 255, 0.22), transparent 50%)',
        }}
      />

      {/* Bifrost rainbow shimmer ring around Mjolnir */}
      <span
        aria-hidden="true"
        className="thor-hero-bifrost-ring"
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background:
            'conic-gradient(from 0deg, #ff5050, #ffa500, #ffd700, #4ccfff, #b446ff, #ff50c8, #ff5050)',
          filter: 'blur(28px)',
          opacity: 0.55,
          animation: 'thor-hero-spin 18s linear infinite',
        }}
      />

      {/* Asgardian rune corners — replace Marvel logo with subtle rune marks */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 18,
          left: 22,
          fontFamily: 'var(--font-runic)',
          fontSize: 22,
          color: 'rgba(240, 215, 122, 0.55)',
          textShadow: '0 0 12px rgba(76, 207, 255, 0.6)',
          letterSpacing: '0.18em',
        }}
      >
        ᚦᛟᚱ
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 18,
          right: 22,
          fontFamily: 'var(--font-runic)',
          fontSize: 22,
          color: 'rgba(118, 207, 255, 0.55)',
          textShadow: '0 0 12px rgba(240, 215, 122, 0.55)',
          letterSpacing: '0.18em',
        }}
      >
        ᛗᛃᛟᛚ
      </span>

      {/* Mjolnir centerpiece (existing PNG) */}
      <img
        src="/assets/Marvel/mjolnir.png"
        alt="Mjolnir, the hammer of Thor"
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'clamp(160px, 38%, 240px)',
          height: 'auto',
          objectFit: 'contain',
          filter:
            'drop-shadow(0 0 18px rgba(255, 215, 0, 0.65)) drop-shadow(0 0 36px rgba(76, 207, 255, 0.55)) drop-shadow(0 8px 22px rgba(0, 0, 0, 0.6))',
          animation: 'thor-hero-float 4.5s ease-in-out infinite',
        }}
        loading="eager"
        decoding="async"
      />

      {/* Lightning bolt accent overlays */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          opacity: 0.55,
        }}
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

// --------------------------------------------------------------------------
// MangaHero — Gear 5 mode hero visual (NO Gear 5 image; pure manga panel)
//   Composition layers (back → front):
//     1. Cream paper + pink cloud sky
//     2. Halftone Ben-Day dots overlay
//     3. Radial speed lines bursting from center
//     4. Sun God Nika sun-rays (gold)
//     5. Cloud silhouettes (white, soft)
//     6. Devil Fruit (Gomu Gomu no Mi) floating at heart
//     7. Kana SFX text scattered (ドン!, ボン!, ゴム!)
//     8. One Piece logo subtle bottom-corner watermark
//     9. Comic word balloon: "I'M GONNA BE KING OF THE PIRATES!"
//    10. Thick black manga panel border (double-stroke)
// --------------------------------------------------------------------------
function MangaHero({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Set sail — click to ring the bell of liberation"
      data-magnetic
      onClick={onClick}
      className="manga-hero"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 420,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Layer 1 — Cream manga paper + pink/blue sky */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 95% 70% at 50% 38%, rgba(255,235,200,0.95) 0%, rgba(255,210,180,0.75) 45%, rgba(255,180,210,0.45) 75%, rgba(180,210,250,0.35) 100%)',
          borderRadius: 10,
        }}
      />

      {/* Layer 2 — Halftone Ben-Day dots */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(140, 60, 30, 0.18) 1.2px, transparent 1.4px)',
          backgroundSize: '7px 7px',
          mixBlendMode: 'multiply',
          opacity: 0.7,
          borderRadius: 10,
        }}
      />

      {/* Layer 3 — Speed lines (manga power-up effect) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.55,
          mixBlendMode: 'multiply',
        }}
      >
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = (i * 360) / 28;
          const rad = (angle * Math.PI) / 180;
          const cx = 200, cy = 200;
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
        aria-hidden="true"
        viewBox="0 0 400 400"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          mixBlendMode: 'screen',
          animation: 'manga-sun-spin 32s linear infinite',
        }}
      >
        <defs>
          <radialGradient id="manga-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ffd766" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff9933" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="url(#manga-sun-glow)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          const rad = (angle * Math.PI) / 180;
          return (
            <polygon
              key={i}
              points={`${200 + Math.cos(rad) * 70},${200 + Math.sin(rad) * 70} ${200 + Math.cos(rad - 0.06) * 200},${200 + Math.sin(rad - 0.06) * 200} ${200 + Math.cos(rad + 0.06) * 200},${200 + Math.sin(rad + 0.06) * 200}`}
              fill="rgba(255, 215, 70, 0.42)"
            />
          );
        })}
      </svg>

      {/* Layer 5 — Soft cloud silhouettes (Skypiea / Onigashima vibe) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.85,
        }}
      >
        <ellipse cx="80" cy="320" rx="70" ry="22" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="140" cy="335" rx="50" ry="18" fill="rgba(255,255,255,0.75)" />
        <ellipse cx="320" cy="310" rx="80" ry="26" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="260" cy="335" rx="55" ry="18" fill="rgba(255,255,255,0.75)" />
      </svg>

      {/* Layer 6 — Devil Fruit centerpiece */}
      <img
        src="/assets/One-Piece/Gomu-Gomu-no-Mi-One-Piece-Devil-Fruit-415.webp"
        alt="Gomu Gomu no Mi — the Sun God Devil Fruit"
        style={{
          position: 'relative',
          zIndex: 2,
          width: 'clamp(140px, 32%, 220px)',
          height: 'auto',
          objectFit: 'contain',
          filter:
            'drop-shadow(0 8px 28px rgba(255, 100, 30, 0.6)) drop-shadow(0 0 18px rgba(255, 215, 70, 0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
          animation: 'manga-fruit-bob 4.5s ease-in-out infinite',
        }}
        loading="eager"
        decoding="async"
      />

      {/* Layer 7 — Kana SFX text scattered around */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          fontFamily: 'var(--font-comic-sfx, "Bangers", "Bebas Neue", sans-serif)',
          fontSize: 'clamp(28px, 5vw, 44px)',
          color: '#d11b1b',
          textShadow: '3px 3px 0 #fff, 4px 4px 0 #1a0d05',
          transform: 'rotate(-12deg)',
          letterSpacing: '0.05em',
        }}
      >
        ドン!
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '18%',
          right: '6%',
          fontFamily: 'var(--font-comic-sfx, "Bangers", "Bebas Neue", sans-serif)',
          fontSize: 'clamp(22px, 4vw, 36px)',
          color: '#1a0d05',
          textShadow: '2px 2px 0 #ffd766',
          transform: 'rotate(8deg)',
        }}
      >
        ゴムゴム!
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '24%',
          left: '6%',
          fontFamily: 'var(--font-comic-sfx, "Bangers", "Bebas Neue", sans-serif)',
          fontSize: 'clamp(20px, 3.5vw, 30px)',
          color: '#1a0d05',
          textShadow: '2px 2px 0 #fff',
          transform: 'rotate(-6deg)',
        }}
      >
        ボン!
      </span>

      {/* Layer 8 — (Speech balloon moved to LEFT column / Luffy portrait) */}

      {/* Layer 9 — One Piece logo subtle watermark */}
      <picture
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          width: 90,
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <source srcSet="/assets/One-Piece/One-Piece-Logo-1416.webp" type="image/webp" />
        <img
          src="/assets/One-Piece/One-Piece-Logo-1416.png"
          alt=""
          aria-hidden="true"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          loading="lazy"
          decoding="async"
        />
      </picture>

      {/* Layer 10 — Manga panel border (thick black double stroke) */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          border: '4px solid #1a0d05',
          boxShadow:
            'inset 0 0 0 2px #fffaf0, inset 0 0 0 6px #1a0d05',
          pointerEvents: 'none',
        }}
      />
    </button>
  );
}

// --------------------------------------------------------------------------
// Mode-crossfade wrapper
// --------------------------------------------------------------------------
function ModeCrossfade({
  isThor,
  reducedMotion,
  children,
}: {
  isThor: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const transitionStyle = reducedMotion
    ? undefined
    : { transition: 'opacity 320ms ease, transform 320ms ease' };

  return (
    <div
      style={{
        ...transitionStyle,
        opacity: 1,
        transform: 'scale(1)',
      }}
      key={isThor ? 'thor' : 'gear5'}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------
// Titles — Round 13: now CMS-driven via useSiteContent('hero').rotatingTitles
// with the static defaults below as the synchronous fallback layer (so first
// paint never flashes empty). The hook layers DB ◀ defaults; if either
// `siteContentDefaults.hero[mode].rotatingTitles` is missing or the DB row is
// shaped wrong, components fall through to these arrays.
// --------------------------------------------------------------------------
const THOR_TITLES_FALLBACK = [
  'AI engineering · Asgardian polish',
  'LLM agents that actually ship',
  'RAG pipelines that strike true',
  'Cinematic frontends · Mjolnir-grade craft',
] as const;

const GEAR5_TITLES_FALLBACK = [
  'AI engineering at Gear 5 velocity',
  'Sun God of LLM workflows',
  'Awakened front-end · joy of use',
  'Building like a Pirate King',
] as const;

export default function Hero() {
  const haloRef = useRef<HTMLDivElement>(null);
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [titleIndex, setTitleIndex] = useState(0);
  const mode = useMode();
  // Round 35 — client-side nav for the "Latest drop" tile so it doesn't
  // trigger a full page reload (which broke mobile rendering of the
  // ProjectDetail page when arriving from the Hero).
  const go = useViewTransitionNav();
  // CMS-driven copy — DB rows ◀ baked-in defaults from siteContentDefaults.
  const heroCopy = useSiteContent('hero');
  // Raw project pool: Supabase rows when available, mode fixtures otherwise.
  // Filtering + selection happen in a derived useMemo below so toggling
  // Thor↔Luffy instantly re-picks the right "latest drop" without re-fetching.
  const [rawProjects, setRawProjects] = useState<Project[]>(
    () => getFixturesForMode(mode),
  );
  const [hasSupabaseData, setHasSupabaseData] = useState(false);
  const motionOn = useMotionOn();
  const { reducedMotion } = useCapability();
  const isThor = mode === 'thor';
  const effectsActive = useEffectsActive();
  const setEffectsActive = useModeStore((s) => s.setEffectsActive);

  const titles = useMemo<readonly string[]>(() => {
    const fromCms = Array.isArray(heroCopy.rotatingTitles)
      ? (heroCopy.rotatingTitles as string[]).filter((t) => typeof t === 'string')
      : null;
    if (fromCms && fromCms.length) return fromCms;
    return isThor ? THOR_TITLES_FALLBACK : GEAR5_TITLES_FALLBACK;
  }, [heroCopy.rotatingTitles, isThor]);

  // Title rotation
  useEffect(() => {
    const id = window.setInterval(
      () => setTitleIndex((i) => (i + 1) % titles.length),
      3200
    );
    return () => window.clearInterval(id);
  }, [titles]);

  // Reset title index on mode switch + reseed fixtures when no Supabase data.
  useEffect(() => {
    setTitleIndex(0);
    if (!hasSupabaseData) {
      setRawProjects(getFixturesForMode(mode));
    }
  }, [mode, hasSupabaseData]);

  // Load latest project from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const projects = await listProjects();
        if (!cancelled && projects.length) {
          setRawProjects(projects);
          setHasSupabaseData(true);
        }
      } catch {
        // Keep fixture pool already in state
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Derive the latest-drop chip per active mode. Re-runs instantly on toggle.
  // Round 76: strip placeholders so the Hero "Latest drop" tile never
  // surfaces a fixture title to public visitors.  When no real rows exist
  // the tile falls back to "Coming soon" via `heroCopy.latestDropFallbackTitle`.
  const latestProject = useMemo<Project | null>(
    () => selectLatest(
      filterProjectsByMode(rawProjects, mode).filter((p) => p.placeholder !== true),
    ),
    [rawProjects, mode],
  );

  // Parallax halo on pointer move
  useEffect(() => {
    const halo = haloRef.current;
    if (!halo) return;
    const handle = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      halo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.addEventListener('pointermove', handle);
    return () => window.removeEventListener('pointermove', handle);
  }, []);

  // Kill lift timeline on unmount
  useEffect(() => () => { tlRef.current?.kill(); }, []);

  // Mjolnir lift click handler (Thor mode)
  function handleLift() {
    playSfx('hammer.ring');
    setTimeout(() => playSfx('thunder.short', { volume: 0.35 }), 120);
    window.dispatchEvent(new CustomEvent('thor:strike'));

    if (!motionOn || reducedMotion) return;

    const container = modelContainerRef.current;
    if (!container) return;

    tlRef.current?.kill();
    tlRef.current = gsap.timeline()
      .to(container, { y: -32, duration: 0.35, ease: 'power2.out' })
      .to(container, { y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
  }

  // Gear 5 awaken click handler — fires the canonical event for any listeners
  // that care (e.g., easter eggs) but no longer auto-starts audio. The Hero
  // mode-toggle stat tile is the canonical opt-in for sustained effects.
  function handleGear5Awaken() {
    window.dispatchEvent(new CustomEvent('gear5:awaken'));
  }

  // Toggle the mode's signature effects on/off. Triggered by clicking the
  // Hero mode stat tile (the only UI that flips this). Activating starts
  // audio + dispatches the awaken/strike event; deactivating stops audio
  // + dispatches the corresponding "rest" event for any listeners.
  const toggleModeEffects = useCallback(() => {
    const next = !effectsActive;
    setEffectsActive(next);
    if (next) {
      if (isThor) {
        playSfx('thunder.short');
        window.dispatchEvent(new CustomEvent('thor:strike'));
      } else {
        playSfx('drums.liberation');
        window.dispatchEvent(new CustomEvent('gear5:awaken'));
      }
    } else {
      if (isThor) {
        window.dispatchEvent(new CustomEvent('thor:rest'));
      } else {
        stopSfx('drums.liberation');
        window.dispatchEvent(new CustomEvent('gear5:rest'));
      }
    }
  }, [effectsActive, isThor, setEffectsActive]);

  const modeValue = effectsActive
    ? String(heroCopy.modeToggleActiveValue ?? (isThor ? 'Engaged' : 'Awakened'))
    : String(heroCopy.modeToggleDormantValue ?? (isThor ? 'Resting' : 'Dormant'));
  const modeDetail = effectsActive
    ? String(heroCopy.modeToggleActiveDetail ?? (isThor
        ? 'Storm FX are live. Tap to silence the thunder.'
        : 'Joy is the ultimate weapon. Tap to rest.'))
    : String(heroCopy.modeToggleDormantDetail ?? (isThor
        ? 'Storm dormant. Tap to summon the lightning.'
        : 'Sun God Nika sleeps. Tap to awaken Gear 5.'));

  const quickStats = useMemo(() => {
    const latestDetail = latestProject?.summary?.trim() || latestProject?.description?.trim();
    const latestLink = latestProject?.slug ? `/projects/${latestProject.slug}` : undefined;
    return [
      {
        kind: 'latest' as const,
        label: String(heroCopy.latestDropLabel ?? 'Latest drop'),
        value: latestProject?.title ?? String(heroCopy.latestDropFallbackTitle ?? 'Coming soon'),
        detail: latestDetail ?? String(heroCopy.latestDropFallbackDetail ?? 'Fresh work is in production. Stay tuned.'),
        href: latestLink,
      },
      {
        kind: 'mode-toggle' as const,
        label: String(heroCopy.modeToggleLabel ?? (isThor ? 'Thor mode' : 'Gear 5')),
        value: modeValue,
        detail: modeDetail,
      },
    ];
  }, [latestProject, isThor, modeValue, modeDetail, heroCopy.latestDropLabel, heroCopy.latestDropFallbackTitle, heroCopy.latestDropFallbackDetail, heroCopy.modeToggleLabel]);

  return (
    <Section
      id="hero"
      label="Hero"
      className="relative overflow-hidden pt-[calc(var(--hdr-h)+0.75rem)] lg:pt-[calc(var(--hdr-h)+5rem)]"
    >
      {/* CSS keyframes injected inline (no extra file) */}
      <style>{`
        @keyframes manga-fruit-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes manga-sun-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="manga-fruit-bob"], [style*="manga-sun-spin"] { animation: none !important; }
        }
      `}</style>

      {/* Background blobs */}
      <div className="absolute inset-x-0 -top-24 -z-20 flex justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[rgb(var(--color-accent)/0.35)] via-[rgb(var(--color-accent-2)/0.28)] to-transparent blur-[140px]" />
      </div>
      <div
        ref={haloRef}
        className="pointer-events-none absolute right-[8%] top-[12%] -z-10 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[rgb(var(--color-highlight)/0.55)] to-transparent opacity-80 blur-[110px]"
      />

      <div className="hero-grid">
        {/* Round 78 — restructured to a 4-block grid (text / model / stats /
            tiles).  On mobile the natural source order = the order users
            scroll through (text → model card → stats → tiles), so the image
            card now appears BEFORE Specialty/Stack/Availability per user
            request.  Desktop uses grid-template-areas to keep the previous
            2-column visual (text|model on top row, stats|tiles bottom). */}
        <div className="hero-grid__text reveal relative flex flex-col gap-6 sm:gap-8">
          {/* Luffy mode: Gear 5 portrait sits as a low-opacity backdrop top-left,
              with a manga shout-burst speech balloon (SVG outline = crisp
              black manga border). Positioned so neither piece covers the
              hero paragraph copy. */}
          {!isThor && (
            <div className="luffy-hero-portrait luffy-hero-portrait--bg" aria-hidden="true">
              <picture>
                <source
                  srcSet="/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image.webp"
                  type="image/webp"
                />
                <img
                  className="luffy-hero-portrait__img"
                  src="/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image.webp"
                  alt=""
                  loading="eager"
                  decoding="async"
                />
              </picture>
              <div className="luffy-hero-balloon">
                {/* SVG silhouette — sharp manga ink stroke, no clip-path softness. */}
                <svg
                  className="luffy-hero-balloon__svg"
                  viewBox="0 0 200 150"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 30,18 L 48,4 L 64,16 L 82,2 L 100,14 L 118,2 L 136,14 L 154,2 L 174,18 L 190,32
                       L 178,48 L 196,62 L 184,78 L 198,92 L 184,106 L 174,118
                       L 168,148 L 158,118
                       L 138,128 L 122,118 L 108,128 L 90,118 L 72,128 L 54,118
                       L 36,124 L 26,108 L 12,118 L 4,100 L 16,86 L 2,70 L 14,54 L 4,38 L 18,30 Z"
                    fill="#fffaf0"
                    stroke="#1a0d05"
                    strokeWidth="5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="luffy-hero-balloon__text">
                  I&apos;M GONNA BE<br />KING OF THE<br />PIRATES!
                </span>
              </div>
            </div>
          )}

          {/* P3: eyebrow lines + H1 removed — the 3D scene + tagline is the statement.
              SEO/a11y preserved via sr-only heading below. */}
          <h1 className="sr-only">{PORTFOLIO.name} — {PORTFOLIO.title}</h1>
          <p
            className="relative z-10 max-w-xl text-lg leading-7 sm:text-xl sm:leading-8"
            style={{ color: 'rgb(var(--color-muted) / 0.8)' }}
          >
            {String(heroCopy.paragraphPrefix ?? (isThor
              ? "LLM agents, RAG pipelines, and cinematic frontends — engineered with the discipline of an Asgardian smith. Right now I'm deep into "
              : "Like Luffy at Gear 5, I build with joy and impossible velocity. AI agents, real-time UIs, frontend that flies. Right now I'm stretching into "))}
            <span className="font-medium" style={{ color: 'rgb(var(--color-ink))' }}>
              {titles[titleIndex]}
            </span>{' '}
            {String(heroCopy.paragraphSuffix ?? (isThor ? '— ready for senior roles & contracts.' : "— let's build something legendary."))}
          </p>

          {/* Round 78 — flex spacers removed; vertical alignment now
              comes from the parent `.hero-grid` 2x2 layout on desktop. */}

          <div className="flex flex-wrap gap-3" data-hero-row="cta">
            <a
              href="/#projects"
              className="hire-me-btn hire-me-btn--secondary"
              data-thor-hover
              data-magnetic
            >
              {String(heroCopy.cta1Label ?? (isThor ? '⚡ VIEW WORK' : 'SET SAIL →'))}
            </a>
            {/* Premium mode-aware Hire Me CTA — see .hire-me-btn in index.css */}
            <a
              href="/#contact"
              className="hire-me-btn"
              data-thor-hover
              data-magnetic
            >
              {String(heroCopy.cta2Label ?? (isThor ? '⚡ HIRE ME' : 'JOIN MY CREW →'))}
            </a>
          </div>
        </div>

        {/* MODEL CARD — "image card" the user wanted before stats on mobile */}
        <div className="hero-grid__model reveal relative mx-auto w-full max-w-[540px]">
          <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-[rgb(var(--color-accent)/0.18)] via-transparent to-[rgb(var(--color-accent-2)/0.25)] blur-3xl" />
          <div className={`card hero-card-shell w-full overflow-hidden pb-8 pt-6 ${!isThor ? 'hero-card-shell--manga' : ''}`}>
            <ModeCrossfade isThor={isThor} reducedMotion={reducedMotion}>
              {isThor ? (
                /* Thor: Mjolnir 3D scene with lift target */
                <div
                  ref={modelContainerRef}
                  className="relative"
                  style={{ willChange: 'transform' }}
                >
                  <HeroModel className="h-[360px] w-full rounded-[24px]" />
                  <button
                    type="button"
                    aria-label="Lift Mjolnir"
                    data-magnetic
                    onClick={handleLift}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '24px',
                      zIndex: 10,
                      transition: 'box-shadow 250ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        `0 0 40px 8px rgb(var(--color-highlight) / 0.25)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  />
                </div>
              ) : (
                <MangaHero onClick={handleGear5Awaken} />
              )}
            </ModeCrossfade>
          </div>
        </div>

        {/* STATS row — Specialty / Stack / Availability */}
        <div className="hero-grid__stats reveal grid gap-4 sm:grid-cols-3" data-hero-row="stats">
            {[
              {
                label: String(heroCopy.statSpecialtyLabel ?? 'Specialty'),
                value: String(heroCopy.statSpecialtyValue ?? 'AI + LLM apps'),
                detail: String(heroCopy.statSpecialtyDetail ?? 'Agents, RAG, evals, vector search, OpenAI/Anthropic SDKs.'),
              },
              {
                label: String(heroCopy.statStackLabel ?? 'Stack'),
                value: String(heroCopy.statStackValue ?? 'React · TS · Supabase'),
                detail: String(heroCopy.statStackDetail ?? 'Edge-ready builds with sub-200ms INP and 95+ Lighthouse.'),
              },
              {
                label: String(heroCopy.statAvailabilityLabel ?? 'Availability'),
                value: String(heroCopy.statAvailabilityValue ?? 'Q2 2026'),
                detail: String(heroCopy.statAvailabilityDetail ?? 'Remote + Tel Aviv. Senior roles & contracts.'),
              },
            ].map((item) => (
              <div key={item.label} className="glass-tile hero-stat-tile rounded-2xl space-y-2">
                <span
                  className="text-xs uppercase tracking-[0.26em]"
                  style={{ color: 'rgb(var(--color-muted) / 0.65)' }}
                >
                  {item.label}
                </span>
                <p className="text-lg font-semibold" style={{ color: 'rgb(var(--color-ink))' }}>
                  {item.value}
                </p>
                <p className="text-sm leading-5" style={{ color: 'rgb(var(--color-muted) / 0.8)' }}>
                  {item.detail}
                </p>
              </div>
            ))}
        </div>

        {/* TILES — Latest Drop + Mode Toggle */}
        <div className="hero-grid__tiles reveal mx-auto grid w-full max-w-[540px] grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
            {quickStats.map((stat) => {
              // Mode-toggle tile is the only interactive opt-in for sustained
              // FX. Render it as a button with pressed/dormant styling.
              if (stat.kind === 'mode-toggle') {
                return (
                  <button
                    key={stat.label}
                    type="button"
                    aria-pressed={effectsActive}
                    onClick={toggleModeEffects}
                    className={[
                      'glass-tile hero-stat-tile hero-stat-tile--mode rounded-2xl text-left',
                      'flex flex-col items-start justify-start gap-2',
                      'cursor-pointer transition-transform duration-200',
                      'hover:-translate-y-0.5 focus-visible:-translate-y-0.5',
                      effectsActive ? 'hero-stat-tile--active' : 'hero-stat-tile--dormant',
                      isThor ? 'hero-stat-tile--mcu' : 'hero-stat-tile--manga',
                    ].join(' ')}
                  >
                    <p
                      className="text-xs uppercase tracking-[0.26em]"
                      style={{ color: 'rgb(var(--color-muted) / 0.65)' }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="inline-flex items-center gap-1.5 text-base font-semibold"
                      style={{
                        color: effectsActive
                          ? 'rgb(var(--color-highlight))'
                          : 'rgb(var(--color-ink))',
                      }}
                    >
                      <span aria-hidden>{effectsActive ? '●' : '○'}</span>
                      {stat.value}
                    </p>
                    <p
                      className="text-xs leading-5"
                      style={{ color: 'rgb(var(--color-muted) / 0.75)' }}
                    >
                      {stat.detail}
                    </p>
                  </button>
                );
              }
              return (
                <div
                  key={stat.label}
                  className="glass-tile hero-stat-tile rounded-2xl flex flex-col items-start justify-start gap-2"
                >
                  <p
                    className="text-xs uppercase tracking-[0.26em]"
                    style={{ color: 'rgb(var(--color-muted) / 0.65)' }}
                  >
                    {stat.label}
                  </p>
                  {stat.href ? (
                    <a
                      href={stat.href}
                      onClick={(e) => {
                        // SPA navigation — full page reload was breaking
                        // mobile rendering of the project detail page when
                        // arriving from the Hero "Latest drop" tile.
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        go(stat.href!);
                      }}
                      className="inline-flex items-center gap-1 text-base font-semibold text-[rgb(var(--color-highlight))]"
                      data-thor-hover
                    >
                      {stat.value}
                      <span aria-hidden>→</span>
                    </a>
                  ) : (
                    <p
                      className="text-base font-semibold"
                      style={{ color: 'rgb(var(--color-ink))' }}
                    >
                      {stat.value}
                    </p>
                  )}
                  <p
                    className="text-xs leading-5"
                    style={{ color: 'rgb(var(--color-muted) / 0.75)' }}
                  >
                    {stat.detail}
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    </Section>
  );
}

function selectLatest(projects: Project[]): Project | null {
  if (!projects.length) return null;
  return [...projects].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  })[0] ?? null;
}
