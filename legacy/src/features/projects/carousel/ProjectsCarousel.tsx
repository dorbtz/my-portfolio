/**
 * ProjectsCarousel — mode-themed accessible carousel for the home page.
 *
 * Transform-based (NOT scroll-snap). The previous version used
 * `slide.scrollIntoView({ behavior: 'smooth' })` on a CSS `scroll-snap`
 * track — which races with Lenis smooth scrolling and causes the page to
 * vertical-scroll on Next/Prev (documented at README.md:75). This rewrite
 * replaces the scrolling track with a fixed-overflow viewport whose inner
 * track is positioned via `transform: translate3d()`. No native scroll
 * events fire on Next/Prev, so the page stays put.
 *
 * Animation: GSAP timeline (already registered in src/lib/gsap.ts) with a
 * mode-themed entrance burst on the active slide.
 *
 * Drag-to-pan: pointerdown/move/up on the viewport with rubber-band
 * resistance at the edges. On release, snaps to the nearest slide.
 *
 * Mode treatments (visual only — same DOM):
 *   Thor  → comic-strip pan. Halftone overlay on enter, POW! SFX scale-in.
 *           Slides flow LTR.
 *   Luffy → manga page-turn (skewX + opacity stagger), kana ink-splatter.
 *           Track uses `flex-direction: row-reverse` so the "next" slide
 *           enters from the visual LEFT (manga reading order).
 *
 * Reduced motion: degrades to a vertical static stack — no transform,
 * no animation, no drag.
 *
 * W3C APG carousel pattern:
 *   role="region", aria-roledescription="carousel"
 *   prev/next buttons with descriptive aria-labels
 *   aria-live="polite" slide-position announcement
 *   visible focus rings, full keyboard navigation (Arrow/Home/End)
 *   no autoplay (user-driven only)
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ProjectCard from '../ProjectCard';
import type { Project } from '../../../types/project';
import { useMode, useMotionOn } from '../../../shared/stores/mode';
import { gsap, withMotion } from '../../effects/lib/gsap';

type Props = {
  projects: Project[];
  /** Override for tests — when true, render the static fallback. */
  forceReducedMotion?: boolean;
};

// Per-mode SFX cycled across slides for visual variety on snap.
const COMIC_SFX = ['BIFF!', 'KRAKKK!', 'POW!', 'ZZAP!', 'BOOM!', 'WHAM!'];
const KANA_SFX = ['ドン!', 'バン!', 'ゴム!', 'ガン!', 'ドカン!', 'ズドン!'];

// How far the user must drag (px) before commit-snapping to the next slide.
const DRAG_COMMIT_THRESHOLD = 60;
// Rubber-band resistance once the user drags past either edge.
const DRAG_EDGE_RESISTANCE = 0.35;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function ProjectsCarousel({
  projects,
  forceReducedMotion = false,
}: Props) {
  const mode = useMode();
  const motionOn = useMotionOn();
  const osReduced = useReducedMotion();
  const isThor = mode === 'thor';
  const isManga = !isThor;

  const reduced = forceReducedMotion || osReduced || !motionOn;

  // Keep the dir helper around for tests + aria; physical layout direction is
  // achieved with flex-direction in CSS, not the dir attribute.
  const dir: 'ltr' | 'rtl' = isManga && !reduced ? 'rtl' : 'ltr';

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Ephemeral burst class — added when activeIndex changes, removed after the
  // entrance animation completes. Keyed by index so React diffs it cleanly.
  const [burstKey, setBurstKey] = useState(0);
  const liveId = useId();

  if (slideRefs.current.length !== projects.length) {
    slideRefs.current = new Array(projects.length).fill(null);
  }

  // ---------------------------------------------------------------------------
  // Track translation — measure-and-translate (not scroll).
  // ---------------------------------------------------------------------------

  /** Compute the translateX needed to center `index` in the viewport. */
  const computeTargetX = useCallback((index: number): number => {
    const slide = slideRefs.current[index];
    const viewport = viewportRef.current;
    if (!slide || !viewport) return 0;
    // offsetLeft is from the parent's content-box; works for both LTR and
    // row-reverse flex tracks because offsetLeft reflects PHYSICAL position.
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const viewportCenter = viewport.offsetWidth / 2;
    return viewportCenter - slideCenter;
  }, []);

  /** Apply a translateX to the track via GSAP (or instantly when reduced). */
  const animateTo = useCallback(
    (targetX: number, durationMs = 600) => {
      const track = trackRef.current;
      if (!track) return;
      if (reduced) {
        gsap.set(track, { x: targetX });
        return;
      }
      withMotion(() => {
        gsap.to(track, {
          x: targetX,
          duration: durationMs / 1000,
          ease: 'expo.out',
          overwrite: 'auto',
        });
      });
    },
    [reduced],
  );

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(projects.length - 1, next));
      setActiveIndex(clamped);
      setBurstKey((k) => k + 1);
      const target = computeTargetX(clamped);
      animateTo(target);
    },
    [projects.length, computeTargetX, animateTo],
  );

  // Re-center on resize so the active slide stays aligned at all viewport
  // widths (mobile rotate, window resize, devtools panel toggle).
  //
  // Also: re-center whenever the slide count or window width changes so the
  // first card lands centered on initial mount, even when:
  //   - projects load asynchronously (length goes 0 → N after Supabase fetch)
  //   - the track is `flex-direction: row-reverse` in manga mode (slide 0 sits
  //     at the rightmost offsetLeft, so default translateX:0 would visually
  //     show middle slides)
  //   - ProjectCard images load and shift the layout
  // Uses useLayoutEffect so the position is set BEFORE first paint — no
  // visible jump from "wrong slide" → "correct slide" after mount.
  useLayoutEffect(() => {
    if (reduced) return;
    let raf = 0;
    function recenter() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const target = computeTargetX(activeIndex);
        gsap.set(trackRef.current, { x: target });
      });
    }
    recenter();
    window.addEventListener('resize', recenter);

    // Watch the track AND the active slide for size changes (image loads,
    // font swaps, etc.) and re-center when they settle.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => recenter());
      if (trackRef.current) ro.observe(trackRef.current);
      if (viewportRef.current) ro.observe(viewportRef.current);
      const active = slideRefs.current[activeIndex];
      if (active) ro.observe(active);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recenter);
      ro?.disconnect();
    };
  }, [activeIndex, reduced, computeTargetX, projects.length, mode]);

  // ---------------------------------------------------------------------------
  // Drag-to-pan (touch + mouse). Pointer events unify both.
  // ---------------------------------------------------------------------------

  const dragRef = useRef<{
    startX: number;
    baseX: number;
    pointerId: number;
    active: boolean;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      // Don't hijack drag if the user is interacting with a button/link inside.
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"]')) return;
      const track = trackRef.current;
      if (!track) return;
      const baseX = gsap.getProperty(track, 'x') as number;
      dragRef.current = {
        startX: e.clientX,
        baseX,
        pointerId: e.pointerId,
        active: true,
      };
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* Some Pointer event polyfills throw; safe to ignore. */
      }
    },
    [reduced],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      // Apply rubber-band resistance once we're near the visual edges.
      const minX = computeTargetX(projects.length - 1);
      const maxX = computeTargetX(0);
      let nextX = drag.baseX + dx;
      if (nextX > maxX) nextX = maxX + (nextX - maxX) * DRAG_EDGE_RESISTANCE;
      if (nextX < minX) nextX = minX + (nextX - minX) * DRAG_EDGE_RESISTANCE;
      gsap.set(trackRef.current, { x: nextX });
    },
    [computeTargetX, projects.length],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      drag.active = false;
      dragRef.current = null;
      // Decide: did the drag exceed the commit threshold?
      if (Math.abs(dx) < DRAG_COMMIT_THRESHOLD) {
        // Snap back to the current slide.
        animateTo(computeTargetX(activeIndex), 380);
        return;
      }
      // Direction depends on physical layout. For LTR tracks, leftward drag
      // (dx<0) advances. For row-reverse tracks (manga), rightward drag (dx>0)
      // advances. We can detect this from offsetLeft of slides[1] vs slides[0].
      const reverse =
        (slideRefs.current[1]?.offsetLeft ?? 0) <
        (slideRefs.current[0]?.offsetLeft ?? 0);
      const advance = reverse ? dx > 0 : dx < 0;
      goTo(advance ? activeIndex + 1 : activeIndex - 1);
    },
    [activeIndex, animateTo, computeTargetX, goTo],
  );

  // ---------------------------------------------------------------------------
  // Keyboard navigation — semantically RTL-aware via the helper.
  // ---------------------------------------------------------------------------

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (reduced) return;
      const visualPrev = dir === 'rtl' ? 1 : -1;
      const visualNext = dir === 'rtl' ? -1 : 1;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goTo(activeIndex + visualPrev);
          return;
        case 'ArrowRight':
          e.preventDefault();
          goTo(activeIndex + visualNext);
          return;
        case 'Home':
          e.preventDefault();
          goTo(0);
          return;
        case 'End':
          e.preventDefault();
          goTo(projects.length - 1);
          return;
        default:
          return;
      }
    },
    [activeIndex, dir, goTo, projects.length, reduced],
  );

  const sfxList = useMemo(
    () => (isThor ? COMIC_SFX : KANA_SFX),
    [isThor],
  );

  // Reduced-motion fallback — vertical stack, all slides visible.
  if (reduced) {
    return (
      <div
        className="projects-carousel projects-carousel--reduced"
        role="region"
        aria-roledescription="carousel"
        aria-label="Selected projects (static list)"
        data-mode={mode}
        data-testid="projects-carousel"
      >
        {projects.map((project, i) => (
          <div
            key={project.id ?? i}
            className="projects-carousel__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${projects.length}: ${project.title ?? 'Untitled'}`}
            data-slide-index={i}
          >
            <ProjectCard project={project} index={i} />
          </div>
        ))}
      </div>
    );
  }

  const prevLabel = isThor ? 'Previous comic panel' : 'Previous wanted poster';
  const nextLabel = isThor ? 'Next comic panel' : 'Next wanted poster';

  return (
    <div
      className={`projects-carousel projects-carousel--${isThor ? 'comic' : 'manga'}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected projects"
      data-mode={mode}
      data-testid="projects-carousel"
      onKeyDown={onKeyDown}
    >
      <div
        ref={viewportRef}
        className="projects-carousel__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        tabIndex={0}
        aria-controls={`${liveId}-track`}
      >
        <div
          id={`${liveId}-track`}
          ref={trackRef}
          className="projects-carousel__track"
        >
          {projects.map((project, i) => (
            <div
              key={project.id ?? i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="projects-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${projects.length}: ${project.title ?? 'Untitled'}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              aria-hidden={i === activeIndex ? undefined : 'true'}
              data-slide-index={i}
              data-active={i === activeIndex || undefined}
            >
              {/* Per-slide SFX burst — visual flavor only.
                  Re-keyed on burstKey so the CSS animation re-fires on each
                  goTo(), even if the active slide didn't change. */}
              <span
                key={`sfx-${i}-${i === activeIndex ? burstKey : 0}`}
                className="projects-carousel__sfx"
                aria-hidden="true"
                lang={isThor ? undefined : 'ja'}
              >
                {sfxList[i % sfxList.length]}
              </span>
              <ProjectCard project={project} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div className="projects-carousel__controls">
        <button
          type="button"
          className="projects-carousel__btn projects-carousel__btn--prev"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label={prevLabel}
          aria-controls={`${liveId}-track`}
        >
          {isThor ? (
            <span aria-hidden="true">◄ ZAP!</span>
          ) : (
            <span aria-hidden="true" lang="ja">前へ ◄</span>
          )}
          <span className="sr-only">{prevLabel}</span>
        </button>
        <span
          className="projects-carousel__counter"
          aria-hidden="true"
        >
          {activeIndex + 1} / {projects.length}
        </span>
        <button
          type="button"
          className="projects-carousel__btn projects-carousel__btn--next"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === projects.length - 1}
          aria-label={nextLabel}
          aria-controls={`${liveId}-track`}
        >
          {isThor ? (
            <span aria-hidden="true">BIFROST ►</span>
          ) : (
            <span aria-hidden="true" lang="ja">► 次へ</span>
          )}
          <span className="sr-only">{nextLabel}</span>
        </button>
      </div>

      <p
        id={liveId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        Slide {activeIndex + 1} of {projects.length}:{' '}
        {projects[activeIndex]?.title ?? 'Untitled'}
      </p>
    </div>
  );
}
