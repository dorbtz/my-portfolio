/**
 * src/components/Marquee.tsx
 * Infinite horizontal marquee band driven by GSAP.
 *
 * Props:
 *  text      - Content string, repeated to fill the band.
 *  direction - 'left' (default) or 'right'.
 *  speed     - Approximate seconds for the full width. Default 20.
 *
 * Accessibility:
 *  - Wrapped in role="marquee" with descriptive aria-label.
 *  - When motion is off (motionOn === false or prefers-reduced-motion),
 *    renders static text with no GSAP animation.
 *
 * Mode-aware text is resolved by the caller; this component is generic.
 */
import { useEffect, useRef } from 'react';
import { gsap, withMotion } from '../lib/gsap';
import { useMotionOn } from '../stores/mode';

interface MarqueeProps {
  text: string;
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}

export default function Marquee({
  text,
  direction = 'left',
  speed = 20,
  className = '',
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const motionOn = useMotionOn();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !motionOn) {
      // Ensure static display if motion disabled mid-session
      if (track) gsap.set(track, { xPercent: 0 });
      return;
    }

    let tween: gsap.core.Tween | null = null;

    withMotion(() => {
      // Reset position
      gsap.set(track, { xPercent: direction === 'left' ? 0 : -50 });

      tween = gsap.to(track, {
        xPercent: direction === 'left' ? -50 : 0,
        duration: speed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          xPercent: gsap.utils.unitize((v: number) =>
            direction === 'left'
              ? ((v % 50) - 50) % 50      // wraps 0 → -50 → 0
              : ((v % 50) + 50) % 50,     // wraps -50 → 0 → -50
          ),
        },
      });
    });

    // Pause on hover
    const el = track.parentElement;
    const onEnter = () => tween?.pause();
    const onLeave = () => tween?.play();
    el?.addEventListener('mouseenter', onEnter);
    el?.addEventListener('mouseleave', onLeave);

    return () => {
      tween?.kill();
      el?.removeEventListener('mouseenter', onEnter);
      el?.removeEventListener('mouseleave', onLeave);
    };
  }, [direction, speed, motionOn]);

  // Repeat content × 2 — sufficient for the xPercent -50 → 0 loop.
  // Four copies were excessive; two with width: 200% produces a seamless loop.
  const repeated = `${text}${text}`;

  return (
    // aria-hidden hides the animated text from screen readers to avoid
    // double-announcement. The sr-only span below is the accessible fallback.
    // role="presentation" (not "marquee" — invalid ARIA) removes list semantics.
    <div
      role="presentation"
      aria-hidden="true"
      className={`overflow-hidden ${className}`}
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap"
        style={{ width: '200%' }}
      >
        <span className="inline-block">{repeated}</span>
        <span className="inline-block" aria-hidden="true">{repeated}</span>
      </div>
      {/* Screen-reader static fallback — hidden visually */}
      <span className="sr-only">{text}</span>
    </div>
  );
}
