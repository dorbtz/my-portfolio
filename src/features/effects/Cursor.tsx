/**
 * src/components/Cursor.tsx
 * Unified magnetic cursor + particle trail.
 * Supersedes HammerHover.tsx — replaces system cursor with a mode-aware
 * cursor and an optional canvas particle trail.
 *
 * Thor mode (P3 redesign + May 2026 refresh):
 *   - Custom cursor disabled in Thor mode (returns null at the bottom of this
 *     file). Falls back to the OS cursor for clarity. Particle trail effect
 *     is also off in Thor mode.
 *   - The previous Mjolnir / Marvel-logo image cursor was removed at user
 *     request and is no longer wired anywhere.
 *
 * Luffy mode:
 *   - Keeps the original dot + outer ring lerp design.
 *
 * Gates:
 *  - Renders nothing on coarse-pointer (touch) devices.
 *  - Renders nothing when motionOn === false or prefers-reduced-motion.
 *  - Particle budget scales by capability tier.
 */
import React, { useEffect, useRef } from 'react';
import { useMode, useMotionOn } from '../../shared/stores/mode';
import { useCapability } from '../../shared/hooks/useCapability';
import { gsap } from './lib/gsap';

// ---- Types -----------------------------------------------------------------

type Mode = 'thor' | 'gear5';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0 → 1, starts at 1, decays to 0
  maxLife: number;  // ms
  born: number;     // performance.now()
  size: number;
  angle: number;    // for spark streaks
}

// ---- Constants -------------------------------------------------------------

const DOT_SIZE = 8;    // px (Luffy mode only)
const RING_SIZE = 36;  // px (Luffy mode only)
const LERP_FACTOR = 0.18;
const PARTICLE_LIFETIME = 600; // ms
const PARTICLE_BASE_SIZE_THOR = 3;
const PARTICLE_BASE_SIZE_GEAR5 = 5;

function particleBudget(tier: 'high' | 'mid' | 'low'): { interval: number; max: number } {
  if (tier === 'high') return { interval: 4, max: 80 };
  if (tier === 'mid')  return { interval: 8, max: 30 };
  return { interval: Infinity, max: 0 };
}

// ---- Canvas particle trail -------------------------------------------------

function spawnParticle(x: number, y: number, mode: Mode): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = mode === 'thor'
    ? 0.8 + Math.random() * 1.6
    : 0.2 + Math.random() * 0.8;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    maxLife: PARTICLE_LIFETIME * (0.6 + Math.random() * 0.4),
    born: performance.now(),
    size: mode === 'thor'
      ? PARTICLE_BASE_SIZE_THOR * (0.5 + Math.random())
      : PARTICLE_BASE_SIZE_GEAR5 * (0.5 + Math.random()),
    angle,
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, mode: Mode): void {
  const alpha = p.life * p.life; // quadratic fade
  if (alpha <= 0.01) return;

  if (mode === 'thor') {
    // Spark streak — short rotated line
    const lightBlue = `rgba(118,207,255,${alpha})`;
    const white = `rgba(255,255,255,${alpha * 0.8})`;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const len = p.size * 2.5;
    const grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, white);
    grad.addColorStop(1, lightBlue);
    ctx.strokeStyle = grad;
    ctx.lineWidth = p.size * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    ctx.restore();
  } else {
    // Gear 5 puff — small circle, cream/gold tint
    const r = p.size * (1 + (1 - p.life) * 1.5); // expand as it fades
    const cx = p.x;
    const cy = p.y;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(255,251,230,${alpha * 0.9})`);
    grad.addColorStop(0.6, `rgba(255,215,0,${alpha * 0.3})`);
    grad.addColorStop(1, `rgba(255,215,0,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Shared canvas + particle logic ----------------------------------------

function useParticleCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mode: Mode,
  tier: 'high' | 'mid' | 'low',
  getMousePos: () => { x: number; y: number },
) {
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    // Shadow as non-null for TypeScript — already guarded above.
    const canvas: HTMLCanvasElement = canvasEl;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Shadow ctx as non-null for TypeScript — already guarded above.
    const ctxEl: CanvasRenderingContext2D = ctx;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const c = canvas.getContext('2d');
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const particles: Particle[] = [];
    let frameCount = 0;
    const { interval, max } = particleBudget(tier);
    let rafId = 0;
    let lastTime = performance.now();

    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = now - lastTime;
      lastTime = now;
      frameCount++;

      const { x: mouseX, y: mouseY } = getMousePos();

      if (frameCount % interval === 0 && particles.length < max) {
        particles.push(spawnParticle(mouseX, mouseY, mode));
      }

      ctxEl.clearRect(0, 0, canvas.width, canvas.height);
      const nowMs = performance.now();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = nowMs - p.born;
        p.life = Math.max(0, 1 - age / p.maxLife);
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const dtClamped = Math.min(dt, 32);
        p.x += p.vx * dtClamped * 0.5;
        p.y += p.vy * dtClamped * 0.5;
        if (mode === 'gear5') p.vy -= 0.02;
        drawParticle(ctxEl, p, mode);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef, mode, tier, getMousePos]);
}


// ---- Luffy cursor — original dot + outer ring + lerp -----------------------

interface LuffyCursorProps {
  tier: 'high' | 'mid' | 'low';
}

function LuffyCursor({ tier }: LuffyCursorProps) {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const getMousePos = useRef(() => mousePos.current).current;

  const showCanvas = tier !== 'low';

  useEffect(() => {
    if (!dotRef.current || !ringRef.current) return;
    // Non-null assertion safe — both checked on the line above.
    const dotEl  = dotRef.current as HTMLDivElement;
    const ringEl = ringRef.current as HTMLDivElement;

    // Hide system cursor
    const styleEl = document.createElement('style');
    styleEl.textContent = '*, *::before, *::after, body { cursor: none !important; }';
    document.head.appendChild(styleEl);

    let ringX = mousePos.current.x;
    let ringY = mousePos.current.y;
    const magnetTarget = { x: ringX, y: ringY };
    let isMagnetic = false;

    function onMouseMove(e: MouseEvent) {
      mousePos.current = { x: e.clientX, y: e.clientY };
      dotEl.style.transform = `translate3d(${e.clientX - DOT_SIZE / 2}px, ${e.clientY - DOT_SIZE / 2}px, 0)`;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const magnetEl = el?.closest('[data-magnetic]') as HTMLElement | null;
      if (magnetEl) {
        const rect = magnetEl.getBoundingClientRect();
        isMagnetic = true;
        gsap.to(magnetTarget, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, duration: 0.4, ease: 'power3.out', overwrite: true });
      } else {
        isMagnetic = false;
        gsap.killTweensOf(magnetTarget);
        magnetTarget.x = e.clientX;
        magnetTarget.y = e.clientY;
      }
    }

    let lastTime = performance.now();
    let rafId = 0;

    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;
      void dt;

      const targetX = isMagnetic ? magnetTarget.x : mousePos.current.x;
      const targetY = isMagnetic ? magnetTarget.y : mousePos.current.y;
      ringX += (targetX - ringX) * LERP_FACTOR;
      ringY += (targetY - ringY) * LERP_FACTOR;
      ringEl.style.transform = `translate3d(${ringX - RING_SIZE / 2}px, ${ringY - RING_SIZE / 2}px, 0)`;
    }

    rafId = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.head.removeChild(styleEl);
      gsap.killTweensOf(magnetTarget);
    };
  }, []);

  useParticleCanvas(canvasRef, 'gear5', tier, getMousePos);

  return (
    <>
      {showCanvas && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}
        />
      )}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: 0, top: 0,
          width: DOT_SIZE, height: DOT_SIZE,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 0 6px #ffffff',
          pointerEvents: 'none', zIndex: 10001, willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: 0, top: 0,
          width: RING_SIZE, height: RING_SIZE,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,215,0,0.85)',
          boxShadow: '0 0 12px rgba(255,215,0,0.55), 0 0 24px rgba(255,215,0,0.25)',
          pointerEvents: 'none', zIndex: 10000, willChange: 'transform',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
}

// ---- Public component — applies all gates before rendering inner -----------

export default function Cursor() {
  const mode      = useMode();
  const motionOn  = useMotionOn();
  const { tier, coarsePointer, reducedMotion } = useCapability();

  // Gate: touch devices, motion off, or OS reduced-motion preference
  if (coarsePointer || !motionOn || reducedMotion) return null;

  // No custom cursor in either mode — both rely on the OS cursor for
  // clarity. Luffy's dot + ring was removed at user request alongside the
  // earlier Thor Mjolnir image cursor; the LuffyCursor component is kept
  // in this file in case it's wanted again later. The `void LuffyCursor`
  // below silences TS6133 (unused) without dropping the implementation.
  void mode;
  void tier;
  void LuffyCursor;
  return null;
}
