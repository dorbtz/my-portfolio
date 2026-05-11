/**
 * src/lib/easterEggs.ts
 * Portfolio easter eggs — initialized once on app boot.
 *
 * Easter egg 1 — Konami code (↑↑↓↓←→←→ba):
 *   1. Force mode = 'gear5'
 *   2. Full-screen white overlay flash (200ms fade-in, 800ms hold, 400ms fade-out)
 *   3. playSfx('drums.liberation')
 *   4. Show NikaSun silhouette for 6 seconds
 *   5. Spawn 30 confetti straw-hat SVGs dropping from top
 *
 * Easter egg 2 — typing "MJOLNIR" anywhere on the home page:
 *   1. Dispatch 'thor:strike' window event × 3
 *   2. Force mode = 'thor'
 *
 * Both respect useMotionOn (animations skip; mode toggle still fires).
 *
 * Exports:
 *   initEasterEggs() — call once in App.tsx useEffect
 *   cleanupEasterEggs() — returned by initEasterEggs, also exported
 */
import { useModeStore } from '../../../shared/stores/mode';
import { playSfx } from '../../../shared/lib/audio';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];
const BUFFER_MAX = 10;
const MJOLNIR_SEQ = 'mjolnir';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let keyBuffer: string[] = [];
let mjolnirBuffer = '';
let nikaSunTimer: ReturnType<typeof setTimeout> | null = null;
let overlayEl: HTMLDivElement | null = null;
let confettiContainer: HTMLDivElement | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function motionAllowed(): boolean {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storeMotion = useModeStore.getState().motionOn;
  return !prefersReduced && storeMotion;
}

/**
 * A simple inline sun SVG silhouette used as a fallback for NikaSun.
 * When src/components/symbols/NikaSun.tsx exists and is built, the
 * NikaSun import in easterEggs is pure SVG-markup—not a React component—
 * so we keep it self-contained here.
 */
function createNikaSunSVG(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '220');
  svg.setAttribute('height', '220');
  svg.setAttribute('viewBox', '0 0 220 220');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-label', 'Sun God Nika silhouette');
  svg.setAttribute('role', 'img');

  // Sun disk
  const disk = document.createElementNS(ns, 'circle');
  disk.setAttribute('cx', '110');
  disk.setAttribute('cy', '110');
  disk.setAttribute('r', '55');
  disk.setAttribute('fill', '#ffd700');
  disk.setAttribute('opacity', '0.9');
  svg.appendChild(disk);

  // Sun rays (12)
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const inner = 60;
    const outer = 90 + (i % 2 === 0 ? 15 : 0);
    const x1 = 110 + inner * Math.cos(angle);
    const y1 = 110 + inner * Math.sin(angle);
    const x2 = 110 + outer * Math.cos(angle);
    const y2 = 110 + outer * Math.sin(angle);
    const ray = document.createElementNS(ns, 'line');
    ray.setAttribute('x1', String(x1));
    ray.setAttribute('y1', String(y1));
    ray.setAttribute('x2', String(x2));
    ray.setAttribute('y2', String(y2));
    ray.setAttribute('stroke', '#ffd700');
    ray.setAttribute('stroke-width', i % 2 === 0 ? '6' : '3');
    ray.setAttribute('stroke-linecap', 'round');
    ray.setAttribute('opacity', '0.85');
    svg.appendChild(ray);
  }

  // Simple face — Nika grin
  const smile = document.createElementNS(ns, 'path');
  smile.setAttribute('d', 'M 90,115 Q 110,132 130,115');
  smile.setAttribute('stroke', '#b8860b');
  smile.setAttribute('stroke-width', '4');
  smile.setAttribute('fill', 'none');
  smile.setAttribute('stroke-linecap', 'round');
  svg.appendChild(smile);

  // Eyes
  [92, 128].forEach((cx) => {
    const eye = document.createElementNS(ns, 'circle');
    eye.setAttribute('cx', String(cx));
    eye.setAttribute('cy', '100');
    eye.setAttribute('r', '5');
    eye.setAttribute('fill', '#b8860b');
    svg.appendChild(eye);
  });

  return svg;
}

/**
 * Create a single straw-hat confetti SVG element.
 */
function createStrawHat(x: number): HTMLDivElement {
  const ns = 'http://www.w3.org/2000/svg';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    top: -60px;
    left: ${x}px;
    width: 40px;
    height: 30px;
    pointer-events: none;
    z-index: 10001;
    animation: ddHatFall ${1.8 + Math.random() * 1.2}s ease-in ${Math.random() * 0.6}s forwards;
    transform: rotate(${(Math.random() - 0.5) * 60}deg);
  `;

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '40');
  svg.setAttribute('height', '30');
  svg.setAttribute('viewBox', '0 0 40 30');
  svg.setAttribute('fill', 'none');

  // Brim — wide flat ellipse
  const brim = document.createElementNS(ns, 'ellipse');
  brim.setAttribute('cx', '20');
  brim.setAttribute('cy', '24');
  brim.setAttribute('rx', '20');
  brim.setAttribute('ry', '6');
  brim.setAttribute('fill', '#d4a017');
  svg.appendChild(brim);

  // Crown — dome
  const crown = document.createElementNS(ns, 'path');
  crown.setAttribute('d', 'M 6,24 Q 6,4 20,4 Q 34,4 34,24');
  crown.setAttribute('fill', '#e8b820');
  svg.appendChild(crown);

  // Stripe
  const stripe = document.createElementNS(ns, 'rect');
  stripe.setAttribute('x', '5');
  stripe.setAttribute('y', '20');
  stripe.setAttribute('width', '30');
  stripe.setAttribute('height', '4');
  stripe.setAttribute('fill', '#e74c3c');
  svg.appendChild(stripe);

  wrapper.appendChild(svg);
  return wrapper;
}

// ---------------------------------------------------------------------------
// Gear 5 awakening sequence
// ---------------------------------------------------------------------------
function triggerGear5Awakening() {
  const motion = motionAllowed();

  // 1. Switch mode
  useModeStore.getState().setMode('gear5');

  // 2. Audio
  playSfx('drums.liberation');

  if (!motion) return; // mode toggled, no visuals

  // 3. Flash overlay
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; inset: 0; background: white; z-index: 9999;
    pointer-events: none; opacity: 0;
    transition: opacity 200ms ease;
  `;
  document.body.appendChild(flash);
  overlayEl = flash;

  // Fade in → hold → fade out
  requestAnimationFrame(() => {
    flash.style.opacity = '1';
    setTimeout(() => {
      flash.style.transition = 'opacity 400ms ease';
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.remove();
        if (overlayEl === flash) overlayEl = null;
      }, 420);
    }, 1000); // 200ms fade-in + 800ms hold
  });

  // 4. NikaSun silhouette
  if (nikaSunTimer) clearTimeout(nikaSunTimer);
  const existingSun = document.getElementById('nika-sun-overlay');
  existingSun?.remove();

  const sunContainer = document.createElement('div');
  sunContainer.id = 'nika-sun-overlay';
  sunContainer.style.cssText = `
    position: fixed;
    top: 8%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    pointer-events: none;
    animation: nikaSunRise 0.6s ease-out forwards;
    filter: drop-shadow(0 0 32px rgba(255,215,0,0.8));
  `;
  const nikaSvg = createNikaSunSVG();
  sunContainer.appendChild(nikaSvg);
  document.body.appendChild(sunContainer);

  nikaSunTimer = setTimeout(() => {
    sunContainer.style.transition = 'opacity 600ms ease';
    sunContainer.style.opacity = '0';
    setTimeout(() => sunContainer.remove(), 620);
  }, 6000);

  // 5. Straw-hat confetti
  if (confettiContainer) {
    confettiContainer.remove();
    confettiContainer = null;
  }
  const container = document.createElement('div');
  container.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 10000; overflow: hidden;';
  document.body.appendChild(container);
  confettiContainer = container;

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * window.innerWidth;
    const hat = createStrawHat(x);
    container.appendChild(hat);
  }

  // Clean up confetti after longest animation
  setTimeout(() => {
    container.remove();
    if (confettiContainer === container) confettiContainer = null;
  }, 3500);
}

// ---------------------------------------------------------------------------
// Mjolnir sequence
// ---------------------------------------------------------------------------
function triggerMjolnirStrike() {
  // Dispatch thor:strike three times in quick succession
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      window.dispatchEvent(new Event('thor:strike'));
    }, i * 120);
  }

  // Force thor mode
  useModeStore.getState().setMode('thor');
}

// ---------------------------------------------------------------------------
// Keydown handler
// ---------------------------------------------------------------------------
function handleKeydown(e: KeyboardEvent) {
  if (typeof e.key !== 'string') return;
  const key = e.key.toLowerCase();

  // ---- Konami buffer ----
  const konamiKey = e.key; // case-sensitive for arrows, lowercase for a/b
  const normalizedKonami = konamiKey === 'a' ? 'a' : konamiKey === 'b' ? 'b' : konamiKey;

  keyBuffer.push(normalizedKonami);
  if (keyBuffer.length > BUFFER_MAX) {
    keyBuffer.shift();
  }

  // Check Konami match
  if (keyBuffer.length === BUFFER_MAX) {
    const match = KONAMI.every((k, i) => keyBuffer[i] === k);
    if (match) {
      keyBuffer = [];
      triggerGear5Awakening();
      return;
    }
  }

  // ---- Mjolnir buffer ----
  // Only accumulate printable characters
  if (key.length === 1) {
    mjolnirBuffer += key;
    // Trim to last 7 chars
    if (mjolnirBuffer.length > MJOLNIR_SEQ.length) {
      mjolnirBuffer = mjolnirBuffer.slice(-MJOLNIR_SEQ.length);
    }
    if (mjolnirBuffer === MJOLNIR_SEQ) {
      mjolnirBuffer = '';
      triggerMjolnirStrike();
    }
  } else {
    // Non-printable key resets the Mjolnir buffer
    mjolnirBuffer = '';
  }
}

// ---------------------------------------------------------------------------
// CSS keyframes injected once
// ---------------------------------------------------------------------------
function injectStyles() {
  if (document.getElementById('easter-egg-styles')) return;
  const style = document.createElement('style');
  style.id = 'easter-egg-styles';
  style.textContent = `
    @keyframes ddHatFall {
      0%   { transform: translateY(0)   rotate(0deg); opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translateY(110vh) rotate(${Math.random() > 0.5 ? '' : '-'}720deg); opacity: 0; }
    }
    @keyframes nikaSunRise {
      from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.7); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);   }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
let initialized = false;
let cleanupFn: (() => void) | null = null;

export function initEasterEggs(): () => void {
  if (initialized || typeof window === 'undefined') return () => {};
  initialized = true;

  injectStyles();
  window.addEventListener('keydown', handleKeydown);

  cleanupFn = () => {
    window.removeEventListener('keydown', handleKeydown);
    if (nikaSunTimer) clearTimeout(nikaSunTimer);
    overlayEl?.remove();
    confettiContainer?.remove();
    keyBuffer = [];
    mjolnirBuffer = '';
    initialized = false;
    cleanupFn = null;
  };

  return cleanupFn;
}

export function cleanupEasterEggs(): void {
  cleanupFn?.();
}
