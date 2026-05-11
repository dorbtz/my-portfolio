/**
 * src/components/LuffyImageRain.tsx
 *
 * Fixed-position decorative scroll layer — ONLY rendered in Gear 5 mode,
 * and hidden on coarsePointer + reducedMotion devices for performance.
 *
 * ONE image visible at any moment: a single global ScrollTrigger tracks
 * which section's vertical midpoint is closest to the viewport center.
 * The active section's image fades in; all others stay at opacity 0.
 *
 * Alternation order: about=left, skills=right, projects=left, contact=right.
 *
 * Mount once in App.tsx outside <BrowserRouter> (same pattern as
 * <CrossFandomBackdrop />).
 */
import { useEffect, useRef } from 'react';
import { useMode } from '../stores/mode';
import { useCapability } from '../hooks/useCapability';
import { gsap, ScrollTrigger, withMotion } from '../lib/gsap';
import { pickActiveSectionIndex } from './luffyImageRainUtils';

// ---------------------------------------------------------------------------
// Image → section mapping
// ---------------------------------------------------------------------------
type RainImage = {
  /** Section element id (without #) */
  sectionId: string;
  src: string;
  alt: string;
  /** Which edge the image anchors to */
  side: 'left' | 'right';
  /** Vertical anchor as percentage from top of viewport */
  topPct: number;
  /**
   * Pixel offset on the anchored side. Negative = pushed past the viewport
   * edge (compensates for transparent padding inside each PNG so the visible
   * character hugs the edge). Tuned per image because each PNG has different
   * transparent margins.
   */
  sideOffsetPx: number;
};

const RAIN_IMAGES: RainImage[] = [
  {
    sectionId: 'about',
    src: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453.webp',
    alt: 'Classic Luffy with straw hat',
    side: 'left',
    topPct: 20,
    // Less negative → image sits more to the right (closer in from the edge)
    sideOffsetPx: -10,
  },
  {
    sectionId: 'skills',
    src: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523.webp',
    alt: 'Portgas D. Ace — fire-fist mastery',
    side: 'left',
    topPct: 25,
    sideOffsetPx: -10,
  },
  {
    sectionId: 'projects',
    src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105.webp',
    alt: 'Captain Luffy — flagship voyages shipped',
    side: 'right',
    topPct: 30,
    // Perfect at the previous global value — keep
    sideOffsetPx: -32,
  },
  {
    sectionId: 'contact',
    src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465.webp',
    alt: 'Luffy waving — ready to connect',
    side: 'right',
    topPct: 20,
    // More negative on a right-anchored image = pushed further to the right
    sideOffsetPx: -56,
  },
];

// ---------------------------------------------------------------------------
// Manga speed-lines burst helper
// ---------------------------------------------------------------------------
let lastBurstMs = 0;
const BURST_COOLDOWN = 1500;

function fireMangaBurst() {
  const now = Date.now();
  if (now - lastBurstMs < BURST_COOLDOWN) return;
  lastBurstMs = now;

  const overlay = document.createElement('div');
  overlay.className = 'manga-speed-lines';
  document.body.appendChild(overlay);

  // Remove after animation completes (200ms in + 600ms out = 800ms total)
  setTimeout(() => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 850);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
// Round 22 — Active opacity tiers:
//   ACTIVE_OPACITY  : full visibility while the user is actively scrolling
//   IDLE_OPACITY    : faded-back so the underlying section content (map
//                     islands, skill cards, contact form) is fully readable
//                     when the user pauses to interact. User explicitly
//                     reported Ace was hiding map detail in the Skills
//                     section — this is the fix.
//   IDLE_DELAY_MS   : how long without scroll activity before fading down.
const ACTIVE_OPACITY = 0.85;
const IDLE_OPACITY = 0.18;
const IDLE_DELAY_MS = 1800;

export default function LuffyImageRain() {
  const mode = useMode();
  const { coarsePointer, reducedMotion } = useCapability();
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const contextRef = useRef<gsap.Context | null>(null);
  const activeIndexRef = useRef<number>(-1);
  const idleTimerRef = useRef<number | null>(null);

  const isActive = mode === 'gear5' && !coarsePointer && !reducedMotion;

  useEffect(() => {
    // Tear down previous context whenever isActive changes
    contextRef.current?.revert();
    contextRef.current = null;
    activeIndexRef.current = -1;
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (!isActive) return;

    withMotion(() => {
      const ctx = gsap.context(() => {
        const sectionIds = RAIN_IMAGES.map((img) => img.sectionId);

        // Start all images hidden and off-screen
        RAIN_IMAGES.forEach((img, i) => {
          const el = imgRefs.current[i];
          if (!el) return;
          const offX = img.side === 'left' ? -320 : 320;
          gsap.set(el, { opacity: 0, x: offX, visibility: 'visible' });
        });

        /** Schedule a fade of the currently-active image to IDLE_OPACITY
         *  after IDLE_DELAY_MS of no scroll activity. Re-arming on every
         *  scroll keeps Ace visible while the user is actively browsing. */
        function scheduleIdleFade() {
          if (idleTimerRef.current !== null) {
            window.clearTimeout(idleTimerRef.current);
          }
          idleTimerRef.current = window.setTimeout(() => {
            const idx = activeIndexRef.current;
            if (idx < 0) return;
            const el = imgRefs.current[idx];
            if (!el) return;
            gsap.to(el, { opacity: IDLE_OPACITY, duration: 0.55, ease: 'power2.out' });
          }, IDLE_DELAY_MS);
        }

        function updateActive() {
          const newIndex = pickActiveSectionIndex(sectionIds);

          if (newIndex === activeIndexRef.current) {
            // Same section — but the user is scrolling, so re-pop the active
            // image back to ACTIVE_OPACITY (it may have faded to idle) and
            // re-arm the idle timer.
            const idx = activeIndexRef.current;
            if (idx >= 0) {
              const el = imgRefs.current[idx];
              if (el) {
                gsap.to(el, { opacity: ACTIVE_OPACITY, duration: 0.25, ease: 'power2.out' });
              }
            }
            scheduleIdleFade();
            return;
          }

          const prevIndex = activeIndexRef.current;
          activeIndexRef.current = newIndex;

          // P3 FIX: instantly hide the outgoing image (gsap.set, not .to) so
          // there is zero overlap between the outgoing and incoming images.
          if (prevIndex >= 0) {
            const prevImg = RAIN_IMAGES[prevIndex];
            const prevEl = imgRefs.current[prevIndex];
            if (prevEl) {
              const offX = prevImg.side === 'left' ? -320 : 320;
              gsap.killTweensOf(prevEl);
              gsap.set(prevEl, { opacity: 0, x: offX });
            }
          }

          // Show new image (slide in from its edge to x: 0) at ACTIVE_OPACITY
          if (newIndex >= 0) {
            const newEl = imgRefs.current[newIndex];
            if (newEl) {
              gsap.killTweensOf(newEl);
              gsap.to(newEl, { opacity: ACTIVE_OPACITY, x: 0, duration: 0.6, ease: 'power2.out' });
              fireMangaBurst();
              scheduleIdleFade();
            }
          }
        }

        // Single global ScrollTrigger that fires onUpdate continuously
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: updateActive,
          onRefresh: updateActive,
        });

        // Run once immediately in case user starts mid-page
        updateActive();
      });

      contextRef.current = ctx;
    });

    return () => {
      contextRef.current?.revert();
      contextRef.current = null;
      activeIndexRef.current = -1;
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [isActive]);

  // Render nothing when not in Gear 5 mode or on coarse/reduced devices
  if (!isActive) return null;

  return (
    <div
      className="luffy-image-rain"
      aria-hidden="true"
      role="presentation"
    >
      {RAIN_IMAGES.map((img, i) => (
        <img
          key={img.sectionId}
          ref={(el) => { imgRefs.current[i] = el; }}
          src={img.src}
          alt={img.alt}
          className="luffy-image-rain__img"
          style={{
            top: `${img.topPct}vh`,
            // Per-image side offset. Each PNG has different transparent
            // padding so each anchor needs its own value (see RAIN_IMAGES).
            [img.side]: `${img.sideOffsetPx}px`,
            // Start invisible; GSAP controls opacity + x
            opacity: 0,
            visibility: 'hidden',
          }}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}
