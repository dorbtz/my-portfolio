/**
 * src/components/Header.tsx
 * Comic-book chrome header — P2-A visual identity overhaul.
 *
 * - Heavy 3px black outlined frame (always-on comic-page border)
 * - Thor mode: blue gradient top hairline; Gear 5: gold gradient hairline
 * - Logo block: name in Bangers font inside tilted rectangle, with Mjolnir + Nika companion icons
 * - Nav links: bold uppercase, double-underline hover (comic-book emphasis)
 * - ModeRocker: SVG icons (MjolnirSigil / NikaSun) — decorative bursts removed in R16
 * - Sound toggle preserved
 * - Mobile drawer: same comic chrome, vertical
 * - All P0 a11y preserved: focus trap, Escape-to-close, aria-label always Latin
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useModeStore, useMode, useSoundOn, useMotionOn, useEffectsActive } from '../stores/mode';
import { playSfx, stopSfx, setAudioMuted } from '../lib/audio';
import { useAuth } from '../hooks/useAuth.helpers';
import { getLenis } from '../lib/lenis';
import { useFocusTrap } from '../hooks/useFocusTrap';
import MjolnirSigil from './symbols/MjolnirSigil';
import NikaSun from './symbols/NikaSun';
import { useViewTransitionNav } from '../lib/navigate';
import { useNavigate } from 'react-router-dom';
import {
  SECRET_SEQUENCE,
  SECRET_GAP_MS,
  INITIAL_SECRET_STATE,
  advanceSecretSequence,
  type SecretState,
  type SecretConfig,
} from '../lib/secretAdminEntry';
import { useSiteContent } from '../features/content/hooks/useSiteContent';
import { PORTFOLIO } from '../lib/portfolioConfig';

// ---- Rune map for Thor mode nav labels ----
const RUNE_MAP: Record<string, string> = {
  about:    'ᚨᛒᛟᚢᛏ',
  projects: 'ᛈᚱᛟᛃᛖᚲᛏᛋ',
  skills:   'ᛋᚲᛁᛚᛚᛋ',
  contact:  'ᚲᛟᚾᛏᚨᚲᛏ',
};

type NavItem = {
  label: string;
  href: string;
  id?: string;
};

const SECTION_LINKS = [
  { id: 'about',    label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills',   label: 'Skills' },
  { id: 'contact',  label: 'Contact' },
] as const;

const SECTION_IDS = SECTION_LINKS.map((link) => link.id) as readonly string[];

// ---- Active section detection ----
function useActiveSection(
  sectionIds: readonly string[]
): [string, (id: string) => void] {
  const [active, setActive] = useState<string>(() => {
    if (typeof window === 'undefined') return sectionIds[0] ?? '';
    const hash = window.location.hash.replace('#', '');
    if (hash && sectionIds.includes(hash)) return hash;
    return sectionIds[0] ?? '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') {
      setActive('');
      return;
    }
    const hash = window.location.hash.replace('#', '');
    if (hash && sectionIds.includes(hash)) {
      setActive(hash);
    } else {
      setActive((prev) => (prev ? prev : sectionIds[0] ?? ''));
    }

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) { setActive(visible[0].target.id); return; }
        const fallback = sections
          .filter((s) => s.getBoundingClientRect().top <= window.innerHeight * 0.4)
          .at(-1);
        if (fallback) setActive(fallback.id);
      },
      { threshold: [0.35, 0.5, 0.65], rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && sectionIds.includes(hash)) setActive(hash);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [sectionIds]);

  return [active, setActive];
}

// ---- Mode flash helper ----
function triggerModeFlash() {
  const div = document.createElement('div');
  div.className = 'mode-flash';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 600);
}

// ---- ModeRocker — SVG icons; decorative ThwackBubble + KirbyDotsBurst removed in R16 ----
function ModeRocker() {
  const mode = useMode();
  const setMode = useModeStore((s) => s.setMode);
  const rockerRef = useRef<HTMLDivElement>(null);

  function activateMode(m: 'thor' | 'gear5') {
    if (m === mode) return;
    triggerModeFlash();
    setTimeout(() => {
      // Mode-store reset of effectsActive=false is automatic. Always stop any
      // looping drums from a previous Luffy session — switching modes should
      // never leave audio playing. The user opts back in via the Hero stat
      // tile if they want effects in the new mode.
      stopSfx('drums.liberation');
      setMode(m);
    }, 80);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next: 'thor' | 'gear5' = mode === 'thor' ? 'gear5' : 'thor';
      activateMode(next);
      const radios = rockerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios?.forEach((btn) => {
        if (btn.dataset.value === next) btn.focus();
      });
    }
  }

  const thorActive = mode === 'thor';
  const gear5Active = mode === 'gear5';

  return (
    <div
      ref={rockerRef}
      role="radiogroup"
      aria-label="Theme mode"
      className="mode-rocker"
      onKeyDown={handleKeyDown}
      style={{ position: 'relative' }}
    >
      {/* Thor option */}
      <button
        type="button"
        role="radio"
        data-value="thor"
        aria-checked={thorActive}
        aria-label="Switch to Thor mode"
        tabIndex={thorActive ? 0 : -1}
        onClick={() => activateMode('thor')}
        className={['mode-rocker__btn', thorActive ? 'mode-rocker__btn--active' : ''].join(' ')}
      >
        <span className={['mode-rocker__icon', thorActive ? 'mode-rocker__icon--glow' : ''].join(' ')}>
          <MjolnirSigil size={20} color={thorActive ? 'rgb(var(--color-highlight))' : 'currentColor'} />
        </span>
        <span
          className="mode-rocker__label"
          style={{
            fontFamily: 'var(--font-comic-sfx)',
            WebkitTextStroke: thorActive ? '0.5px currentColor' : 'none',
          }}
        >
          THOR
        </span>
      </button>

      {/* Gear 5 option */}
      <button
        type="button"
        role="radio"
        data-value="gear5"
        aria-checked={gear5Active}
        aria-label="Switch to Luffy mode"
        tabIndex={gear5Active ? 0 : -1}
        onClick={() => activateMode('gear5')}
        className={['mode-rocker__btn', gear5Active ? 'mode-rocker__btn--active' : ''].join(' ')}
      >
        <span
          className={['mode-rocker__icon', gear5Active ? 'mode-rocker__icon--glow' : ''].join(' ')}
          // When Thor mode is active (dark theme), tint the Nika icon white so it's
          // clearly visible against the dark Asgard chrome.
          style={!gear5Active ? { filter: 'brightness(0) invert(1)', opacity: 0.85 } : undefined}
        >
          <NikaSun size={20} color={gear5Active ? 'rgb(var(--color-accent))' : '#ffffff'} />
        </span>
        <span
          className="mode-rocker__label"
          style={{
            fontFamily: 'var(--font-comic-sfx)',
            WebkitTextStroke: gear5Active ? '0.5px currentColor' : 'none',
          }}
        >
          LUFFY
        </span>
      </button>
    </div>
  );
}

// ---- SoundToggle ----
function SoundToggle() {
  const soundOn = useSoundOn();
  const setSoundOn = useModeStore((s) => s.setSoundOn);
  const mode = useMode();
  const effectsActive = useEffectsActive();

  // Keep Howler's master mute in sync with the store on every change so a
  // currently-playing loop (drums of liberation) silences instantly when the
  // user mutes, and resumes immediately on unmute. Only re-arm the Luffy
  // loop when effects are *actively engaged* — otherwise un-muting from a
  // dormant Luffy session shouldn't suddenly start playing drums.
  useEffect(() => {
    setAudioMuted(!soundOn);
    if (soundOn && mode === 'gear5' && effectsActive) {
      playSfx('drums.liberation');
    }
  }, [soundOn, mode, effectsActive]);

  return (
    <button
      type="button"
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
      title={soundOn ? 'Sound on' : 'Sound off'}
      onClick={() => setSoundOn(!soundOn)}
      className={[
        'header-icon-btn',
        soundOn ? 'header-icon-btn--active' : '',
      ].join(' ')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        {soundOn ? (
          <path
            fill="currentColor"
            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
          />
        ) : (
          <path
            fill="currentColor"
            d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
          />
        )}
      </svg>
    </button>
  );
}

// ---- NavLabel: letter-by-letter rune → Latin morph on hover (Thor mode) ----
//
// P3 redesign: instead of GSAP ScrambleText scrambling the whole word, each
// character morphs individually left-to-right with a 60ms stagger, giving a
// sequential "flip" effect. On mouseleave the sequence reverses right-to-left.
//
// Each character is in its own <span> so it can independently receive the
// .letter-flip CSS animation class. A transient requestAnimationFrame call
// toggles the class (add → remove after one frame) to retrigger the keyframe.
//
// When motion is off: instant full-word swap, no per-letter stagger.
// Screen readers: aria-label on the parent <a> always contains the Latin label.

function NavLabel({ id, label, isThor }: { id: string; label: string; isThor: boolean }) {
  const rune = RUNE_MAP[id];
  const motionOn = useMotionOn();

  // Pad both strings to same length so char arrays align.
  const len = rune ? Math.max(rune.length, label.length) : label.length;
  const runeArr  = rune  ? Array.from(rune.padEnd(len, ' '))  : [];
  const latinArr = Array.from(label.padEnd(len, ' '));

  // chars state — starts at rune characters
  const [chars, setChars] = React.useState<string[]>(
    isThor && rune ? runeArr : latinArr
  );
  // Track in-flight timers so we can cancel on direction change / unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Track whether we are currently showing latin (to know reverse direction)
  const isLatinRef = useRef(false);

  // Reset to rune when mode changes
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (isThor && rune) {
      setChars(runeArr);
      isLatinRef.current = false;
    } else {
      setChars(latinArr);
      isLatinRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThor, rune]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  function morphTo(target: string[], reverse: boolean) {
    // Cancel any in-flight morph
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!motionOn || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      // Motion off: instant swap
      setChars([...target]);
      isLatinRef.current = !reverse;
      return;
    }

    // Stagger: 60ms per character, left-to-right for enter, right-to-left for leave
    const indices = Array.from({ length: target.length }, (_, i) => reverse ? target.length - 1 - i : i);
    indices.forEach((charIdx, step) => {
      const t = setTimeout(() => {
        setChars((prev) => {
          const next = [...prev];
          next[charIdx] = target[charIdx];
          return next;
        });
      }, step * 60);
      timersRef.current.push(t);
    });
    isLatinRef.current = !reverse;
  }

  function onEnter() {
    if (!isThor || !rune) return;
    morphTo(latinArr, false);
  }

  function onLeave() {
    if (!isThor || !rune) return;
    morphTo(runeArr, true);
  }

  if (!isThor || !rune) return <>{label}</>;

  return (
    <span
      aria-hidden="true"
      title={label}
      style={{ fontFamily: 'var(--font-runic)', display: 'inline-block' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', transition: 'color 80ms ease' }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

// ---- Logo Block — comic title block with tilted border ----
//
// Round 63 — hidden admin entry baked into the wordmark.  Clicking the
// D of "DOR" (idx 0), then the B of "BEN" (idx 4), then the T of
// "TZUR" (idx 8), each within SECRET_GAP_MS, navigates to /admin/login.
// Visuals are unchanged — letters are rendered as inline spans inside
// the same .logo-block__text wrapper (font, kerning, hover-rotate-and-
// scale on the block all inherit).  Sequence handlers attach ONLY to
// the three sequence positions; every other letter falls through to
// the parent <a>'s normal /#hero scroll, exactly like before.  The
// FIRST click (D from a clean state) is intentionally NOT
// preventDefault'd, so casual visitors see the logo behave like a
// normal home link.
const LOGO_TEXT = PORTFOLIO.name.toUpperCase();

/** Validate a CMS-supplied secret-sequence value.  Returns the array if it
 *  looks safe (all integers, in range, non-empty, no duplicates), else null
 *  so the caller can fall back to the in-code default.  Strict guards keep
 *  a malformed admin save from quietly disabling the entry. */
function parseSecretSequence(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: number[] = [];
  const seen = new Set<number>();
  for (const v of raw) {
    if (typeof v !== 'number' || !Number.isInteger(v)) return null;
    if (v < 0 || v >= LOGO_TEXT.length) return null;
    if (LOGO_TEXT[v] === ' ') return null; // can't click a space
    if (seen.has(v)) return null;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function parseSecretGapMs(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  // Sane bounds: at least one frame, no more than five seconds.
  if (raw < 50 || raw > 5000) return null;
  return raw;
}

function LogoBlock() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const nav = useViewTransitionNav();
  const secretStateRef = useRef<SecretState>(INITIAL_SECRET_STATE);

  // Round 64 — Phase B: read sequence + gap from the CMS (per current
  // mode), with strict validation.  Bad / missing CMS values fall back
  // to the in-code constants — the secret never silently breaks.
  const adminContent = useSiteContent('admin');
  const config = useMemo<SecretConfig>(() => {
    const sequence = parseSecretSequence(adminContent.secretSequence) ?? [...SECRET_SEQUENCE];
    const gapMs = parseSecretGapMs(adminContent.secretGapMs) ?? SECRET_GAP_MS;
    return { sequence, gapMs };
  }, [adminContent.secretSequence, adminContent.secretGapMs]);

  const sequenceSet = useMemo(() => new Set(config.sequence), [config.sequence]);

  const handleSecretLetterClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>, idx: number) => {
      // Ignore non-primary clicks and any click with a modifier key,
      // so Cmd/Ctrl-click on the logo still opens /#hero in a new tab.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const result = advanceSecretSequence(
        secretStateRef.current,
        { idx, now: Date.now() },
        config,
      );

      // preventDefault policy: only when the click moved the sequence
      // past step 0, OR completed it.  The very first click stays
      // observable as a normal home-link tap.
      const movedPastFirst = !result.completed && result.progress > 1;
      if (result.completed || movedPastFirst) {
        e.preventDefault();
      }

      secretStateRef.current = {
        progress: result.progress,
        lastClickTime: result.lastClickTime,
      };

      if (result.completed) {
        // Belt-and-braces: helper already resets, but Header is
        // persistent across routes — keep the ref idempotent.
        secretStateRef.current = INITIAL_SECRET_STATE;
        nav('/admin/login');
      }
    },
    [nav, config],
  );

  // Round 37 — logo navigates to "/" (true homepage). When already on the
  // homepage, just smooth-scroll back to the top instead of reloading.
  const handleLogoClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (typeof window === 'undefined') return;
      if (window.location.pathname === '/') {
        e.preventDefault();
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Clear any stale hash so a refresh lands at top, not at /#hero.
        if (window.location.hash) {
          window.history.replaceState(null, '', '/');
        }
      } else {
        e.preventDefault();
        nav('/');
      }
    },
    [nav],
  );

  return (
    <a
      href="/"
      onClick={handleLogoClick}
      className="logo-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.55)]"
      aria-label={`${PORTFOLIO.name} — home`}
    >
      <span className="logo-block__inner">
        {/* Dual fandom icons — NikaSun turns white in Thor mode for visibility */}
        <span className="logo-block__icons" aria-hidden="true">
          <MjolnirSigil size={18} color="currentColor" className="logo-icon logo-icon--mjolnir" />
          <NikaSun size={18} color="currentColor" className="logo-icon logo-icon--nika" forceWhite={isThor} />
        </span>
        <span className="logo-block__text" style={{ fontFamily: 'var(--font-display)' }}>
          {Array.from(LOGO_TEXT).map((char, i) => {
            if (char === ' ') {
              // Raw space between word spans — same kerning as the
              // single text node we replaced.
              return <React.Fragment key={i}>{' '}</React.Fragment>;
            }
            const isSecretLetter = sequenceSet.has(i);
            return (
              <span
                key={i}
                onClick={
                  isSecretLetter
                    ? (e) => handleSecretLetterClick(e, i)
                    : undefined
                }
              >
                {char}
              </span>
            );
          })}
        </span>
      </span>
    </a>
  );
}

// ---- Main Header ----
export default function Header() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useActiveSection(SECTION_IDS);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useFocusTrap(open, () => setOpen(false), hamburgerRef);
  // Cross-route nav (Round 37+1) — react-router navigate is used when the
  // user clicks a section link from a non-home route (e.g. /projects/slug).
  const navigate = useNavigate();

  const navLinks = useMemo<NavItem[]>(() => {
    // Section nav only — the standalone Admin pill next to Hire Me is the
    // single canonical entry-point to the admin dashboard. Keeping a second
    // "Admin" link in the section nav was confusing (two doors to the same
    // place from the same header).
    return SECTION_LINKS.map((link) => ({
      label: link.label,
      href: `/#${link.id}`,
      id: link.id,
    }));
  }, []);

  useEffect(() => {
    const { style } = document.body;
    const prev = style.overflow;
    if (open) style.overflow = 'hidden';
    return () => { style.overflow = prev; };
  }, [open]);

  // Helper — perform the actual scroll to a section once we know it's
  // mounted in the DOM. Returns true if the section was found.
  //
  // Round 37+3 — scrolls PAST the section's top edge so the BIFF! /
  // squiggle divider that sits BEFORE the section is fully off-screen
  // above the viewport, and the section content (skipping its internal
  // padding) is visible immediately below the header band. Positive
  // total offset means viewport_top ≥ section.top, so the divider is
  // never on screen.
  const scrollToSectionEl = useCallback((id: string): boolean => {
    const el = document.getElementById(id);
    if (!el) return false;
    const lenis = getLenis();
    const scrollOffset = 130;
    if (lenis) {
      lenis.scrollTo(el, { offset: scrollOffset });
    } else {
      const targetY = el.getBoundingClientRect().top + window.scrollY + scrollOffset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    window.history.replaceState(null, '', `/#${id}`);
    return true;
  }, []);

  const handleSectionNav = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      if (typeof window === 'undefined') return;
      const isHome = window.location.pathname === '/';

      // Cross-route case (Round 37+1): user is on /projects/* (or any
      // non-home route) and clicks a section link. Navigate to `/`, wait
      // for the target section to mount, then RE-SCROLL several times to
      // stay locked on it as the homepage's lazy content (images, fonts,
      // Lenis re-init) shifts the section's offsetTop. Without the
      // re-scroll, the first scroll lands on the right Y but later
      // reflows leave the user looking at whatever section now occupies
      // that Y — usually About, since it sits highest.
      if (!isHome) {
        event.preventDefault();
        setOpen(false);
        setActiveSection(id);
        navigate('/');
        let mounted = false;
        let attempts = 0;
        const maxAttempts = 30; // up to ~3 s waiting for mount
        const tickMount = () => {
          if (scrollToSectionEl(id)) {
            mounted = true;
            // Re-scroll at increasing delays to defeat post-mount layout
            // shifts (lazy components, image loads).
            [120, 300, 600, 1200].forEach((d) =>
              setTimeout(() => scrollToSectionEl(id), d),
            );
            return;
          }
          if (attempts++ >= maxAttempts || mounted) return;
          setTimeout(tickMount, 100);
        };
        setTimeout(tickMount, 80);
        return;
      }

      event.preventDefault();
      setOpen(false);
      setActiveSection(id);
      requestAnimationFrame(() => {
        scrollToSectionEl(id);
      });
    },
    [setActiveSection, navigate, scrollToSectionEl]
  );

  return (
    <header className={['site-header', 'comic-header', isThor ? 'comic-header--thor' : 'comic-header--gear5'].join(' ')}>
      {/* Mode-aware top hairline */}
      <div className="comic-header__hairline" aria-hidden="true" />

      <div className="nav-wrap flex h-full items-center justify-between gap-4">
        {/* Logo block */}
        <LogoBlock />

        {/* Desktop nav — hidden on mobile (< 768 px), shown on md+ */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => {
            const isSection = Boolean(link.id);
            const dataActive = isSection && activeSection === link.id ? 'true' : undefined;
            const onClick = isSection
              ? (e: MouseEvent<HTMLAnchorElement>) => handleSectionNav(e, link.id!)
              : undefined;
            return (
              <a
                key={link.label}
                href={link.href}
                data-thor-hover
                data-magnetic
                data-active={dataActive}
                aria-label={link.label}
                className="comic-nav-link"
                onClick={onClick}
                style={{ fontFamily: 'var(--font-cinematic)' }}
              >
                {link.id ? (
                  <NavLabel id={link.id} label={link.label} isThor={isThor} />
                ) : (
                  link.label
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop controls — hidden on mobile (< 768 px) */}
        <div className="hidden md:flex items-center gap-2">
          <SoundToggle />
          <ModeRocker />
          {user ? (
            <a
              href="/admin"
              className="header-admin-pill"
              aria-label="Open admin dashboard"
              title="Open admin dashboard"
            >
              <span className="header-admin-pill__icon" aria-hidden>
                {/* Shield + spark glyph */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
                    fill="currentColor"
                    opacity="0.85"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
              <span className="header-admin-pill__label">ADMIN</span>
              <span className="header-admin-pill__sheen" aria-hidden />
            </a>
          ) : null}
          <a
            href="/#contact"
            data-thor-hover
            data-magnetic
            className="hire-me-btn hire-me-btn--sm"
            onClick={(e) => handleSectionNav(e, 'contact')}
          >
            {/* Mode-aware label is handled visually by the .hire-me-btn theming */}
            Hire Me
          </a>
        </div>

        {/* Hamburger — shown on mobile only (< 768 px) */}
        <button
          ref={hamburgerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className="md:hidden comic-hamburger"
          onClick={() => setOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" className="opacity-85" aria-hidden>
            <path
              fill="currentColor"
              d="M4 6.25C4 5.55964 4.55964 5 5.25 5H18.75C19.4404 5 20 5.55964 20 6.25C20 6.94036 19.4404 7.5 18.75 7.5H5.25C4.55964 7.5 4 6.94036 4 6.25ZM4 12C4 11.3096 4.55964 10.75 5.25 10.75H18.75C19.4404 10.75 20 11.3096 20 12C20 12.6904 19.4404 13.25 18.75 13.25H5.25C4.55964 13.25 4 12.6904 4 12ZM5.25 16.5C4.55964 16.5 4 17.0596 4 17.75C4 18.4404 4.55964 19 5.25 19H18.75C19.4404 19 20 18.4404 20 17.75C20 17.0596 19.4404 16.5 18.75 16.5H5.25Z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[49] bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawerRef as React.Ref<HTMLElement>}
            id="mobile-drawer"
            className={['comic-drawer', isThor ? 'comic-drawer--thor' : 'comic-drawer--gear5'].join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer hairline */}
            <div className="comic-drawer__hairline" aria-hidden="true" />

            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <MjolnirSigil size={20} color="currentColor" className="opacity-70" />
                {/* forceWhite in Thor mode — keeps icon visible against dark drawer */}
                <NikaSun size={20} color="currentColor" className="opacity-70" forceWhite={isThor} />
                <span
                  className="text-sm font-bold uppercase tracking-[0.22em]"
                  style={{ fontFamily: 'var(--font-display)', color: 'rgb(var(--color-muted)/0.7)' }}
                >
                  Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="comic-hamburger"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.7a1 1 0 1 0-1.41 1.42L10.58 12l-4.87 4.88a1 1 0 1 0 1.41 1.41L12 13.41l4.88 4.88a1 1 0 0 0 1.41-1.41L13.42 12l4.88-4.88a1 1 0 0 0 0-1.41Z"
                  />
                </svg>
              </button>
            </div>

            {/* Round 37 — controls (mode toggle + sound) hoisted to the
                TOP of the drawer so they're the first thing visible when
                the menu opens. Section nav follows beneath. */}
            <div className="px-4 pt-3 pb-2 space-y-3">
              <div className="glass-tile flex items-center justify-between gap-2 rounded-2xl px-3 py-2 flex-wrap">
                <SoundToggle />
                <ModeRocker />
              </div>
            </div>

            <nav
              className="flex flex-col gap-1 px-4 py-2 text-lg font-semibold"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => {
                const isSection = Boolean(link.id);
                const onClick = isSection
                  ? (e: MouseEvent<HTMLAnchorElement>) => handleSectionNav(e, link.id!)
                  : () => setOpen(false);
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    data-thor-hover
                    aria-label={link.label}
                    className="comic-nav-link comic-nav-link--drawer"
                    style={{ fontFamily: 'var(--font-cinematic)' }}
                    onClick={onClick}
                  >
                    {link.id ? (
                      <NavLabel id={link.id} label={link.label} isThor={isThor} />
                    ) : (
                      link.label
                    )}
                  </a>
                );
              })}
            </nav>

            <div className="mt-auto px-4 pb-6 space-y-3">
              {user ? (
                <a
                  href="/admin"
                  className="header-admin-pill w-full justify-center"
                  style={{ display: 'inline-flex' }}
                  onClick={() => setOpen(false)}
                >
                  <span className="header-admin-pill__icon" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
                        fill="currentColor"
                        opacity="0.85"
                      />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                  <span className="header-admin-pill__label">ADMIN</span>
                  <span className="header-admin-pill__sheen" aria-hidden />
                </a>
              ) : null}
              <a
                href="/#contact"
                data-thor-hover
                className="hire-me-btn w-full"
                onClick={(e) => handleSectionNav(e, 'contact')}
              >
                Hire Me
              </a>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
