/**
 * src/components/RainbowRain.tsx
 * Mode-aware background canvas effect:
 *  - Thor mode: rainbow Bifrost streaks (existing behavior)
 *  - Gear 5 mode: warm cream/gold cloud puffs drifting upward
 * Subscribes to mode store directly. Renders null when motionOn is off.
 */
import { useEffect, useRef } from 'react';
import { useModeStore, useMotionOn } from '../../shared/stores/mode';

export default function RainbowRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Reactive to motionOn — render nothing when motion disabled
  const motionOn = useMotionOn();

  useEffect(() => {
    if (!motionOn) {
      // Clear and remove any existing canvas
      document.querySelectorAll('.rain-underlay').forEach((n) => n.remove());
      return;
    }

    // Remove duplicates (from HMR)
    document.querySelectorAll('.rain-underlay').forEach((n) => n.remove());

    const c = document.createElement('canvas');
    c.className = 'rain-underlay';
    Object.assign(c.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '-1',
      pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(c);
    canvasRef.current = c;

    const ctx = c.getContext('2d', { alpha: true })!;
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, running = false, last = performance.now();

    // Current mode (read initially; will be updated via subscription)
    let currentMode = useModeStore.getState().mode;

    // ----- Thor mode: rainbow streaks -----
    type Streak = {
      x: number; y: number;
      len: number; thick: number;
      hue: number; a: number;
      vy: number;
      wob: number; wobSpd: number; wobAmp: number;
    };
    const STREAK_COUNT = 260;
    const streaks: Streak[] = new Array(STREAK_COUNT);

    // ----- Gear 5 mode: cloud puffs -----
    type Puff = {
      x: number; y: number;
      r: number;        // radius
      vx: number; vy: number; // velocity
      a: number;        // alpha
      warmth: number;   // 0=cream, 1=gold
    };
    const PUFF_COUNT = 80;
    const puffs: Puff[] = new Array(PUFF_COUNT);

    // scroll tracking
    let sectionTops: number[] = [];
    let lastMid = 0;
    let targetDir = 1;
    let dir = 1;

    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // ---- streak helpers ----
    function seedStreak(i: number, fromTop = true) {
      streaks[i] = {
        x: rnd(W * 0.08, W * 0.92),
        y: fromTop ? rnd(-30, -H * 0.15) : rnd(H + 30, H * 1.15),
        len: rnd(18, 60),
        thick: rnd(1.0, 2.2),
        hue: rnd(0, 360),
        a: rnd(0.35, 0.9),
        vy: rnd(120, 280),
        wob: rnd(0, Math.PI * 2),
        wobSpd: rnd(1.2, 2.1),
        wobAmp: rnd(6, 18),
      };
    }

    // ---- puff helpers ----
    function seedPuff(i: number, fromBottom = true) {
      puffs[i] = {
        x: rnd(W * 0.05, W * 0.95),
        y: fromBottom ? rnd(H + 20, H * 1.2) : rnd(-80, H),
        r: rnd(18, 55),
        vx: rnd(-8, 8),
        vy: rnd(-30, -12), // drift upward
        a: rnd(0.15, 0.5),
        warmth: Math.random(),
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.style.width = W + 'px';
      c.style.height = H + 'px';
      c.width = Math.floor(W * dpr);
      c.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = 0; i < STREAK_COUNT; i++) seedStreak(i, Math.random() < 0.5);
      for (let i = 0; i < PUFF_COUNT; i++) seedPuff(i, Math.random() < 0.5);
    }

    function measureSections() {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('main .section'));
      sectionTops = nodes.length ? nodes.map((el) => el.offsetTop) : [0];
    }

    function streakGradient(x: number, y: number, len: number, hue: number, a: number) {
      const g = ctx.createLinearGradient(x, y - len / 2, x, y + len / 2);
      g.addColorStop(0.00, `hsla(${(hue + 20) % 360} 100% 72% / 0)`);
      g.addColorStop(0.25, `hsla(${(hue + 0) % 360} 100% 70% / ${a * 0.9})`);
      g.addColorStop(0.50, `hsla(${(hue + 60) % 360} 100% 65% / ${a})`);
      g.addColorStop(0.75, `hsla(${(hue + 100) % 360} 100% 60% / ${a * 0.9})`);
      g.addColorStop(1.00, `hsla(${(hue + 120) % 360} 100% 55% / 0)`);
      return g;
    }

    function nebula(o: number) {
      const g1 = ctx.createRadialGradient(
        W * 0.5, H * 0.6, Math.max(W, H) * 0.06,
        W * 0.5, H * 0.55, Math.max(W, H) * 0.9
      );
      g1.addColorStop(0.0, 'rgba(140,190,255,0.15)');
      g1.addColorStop(0.4, 'rgba(255,140,230,0.07)');
      g1.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = o * 0.9;
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      ctx.globalAlpha = o * 0.25;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 30; i++) {
        const x = (i * 97) % (W + 120) - 60;
        const y = (i * 137) % Math.floor(H * 0.9);
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    let lastBloomIdx = -1;
    let lastBloomAt = 0;
    function bloom(intensity: number, now: number) {
      const mid = window.scrollY + H * 0.5;
      let idx = 0, best = Infinity;
      for (let i = 0; i < sectionTops.length; i++) {
        const d = Math.abs(mid - sectionTops[i]);
        if (d < best) { best = d; idx = i; }
      }
      if (idx === lastBloomIdx && now - lastBloomAt < 900) return;
      lastBloomIdx = idx; lastBloomAt = now;

      const y = clamp(sectionTops[idx] - window.scrollY, 0, H);
      const g = ctx.createRadialGradient(W * 0.5, y, 12, W * 0.5, y, Math.max(W, H) * 0.45);
      g.addColorStop(0.0, 'rgba(255,255,255,0.20)');
      g.addColorStop(0.3, 'rgba(120,210,255,0.20)');
      g.addColorStop(0.6, 'rgba(160,120,255,0.10)');
      g.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(intensity, 0, 1) * 0.8;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    function drawThorFrame(dt: number, opacity: number, now: number) {
      nebula(opacity);

      const mid = window.scrollY + H * 0.5;
      let nearest = sectionTops[0] ?? 0;
      for (const top of sectionTops) {
        if (Math.abs(mid - top) < Math.abs(mid - nearest)) nearest = top;
      }
      const env = clamp(1 - Math.abs(mid - nearest) / (H * 0.55), 0, 1);
      if (env > 0.85) bloom(env, now);

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < STREAK_COUNT; i++) {
        const s = streaks[i];
        s.y += dir * s.vy * dt;
        s.x += Math.sin(s.wob) * s.wobAmp * dt * 0.5;
        s.wob += s.wobSpd * dt;
        s.hue = (s.hue + 50 * dt) % 360;

        if (dir > 0 && s.y - s.len > H + 40) seedStreak(i, true);
        if (dir < 0 && s.y + s.len < -40) seedStreak(i, false);

        ctx.strokeStyle = streakGradient(s.x, s.y, s.len, s.hue, s.a * opacity);
        ctx.lineWidth = s.thick;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.len * 0.5);
        ctx.lineTo(s.x, s.y + s.len * 0.5);
        ctx.stroke();

        ctx.globalAlpha = (s.a * opacity) * 0.15;
        ctx.fillStyle = `hsla(${(s.hue + 60) % 360} 100% 60% / 0.35)`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.thick * 2.4, s.len * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawGear5Frame(dt: number, opacity: number) {
      // Warm ambient wash
      const g = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, Math.max(W, H) * 0.8);
      g.addColorStop(0.0, `rgba(255,215,0,${0.06 * opacity})`);
      g.addColorStop(0.5, `rgba(255,238,88,${0.03 * opacity})`);
      g.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Cloud puffs
      for (let i = 0; i < PUFF_COUNT; i++) {
        const p = puffs[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt * 0.3;

        if (p.y + p.r < -20) seedPuff(i, true);

        // cream → gold
        const r = Math.round(255);
        const gb = Math.round(lerp(251, 215, p.warmth));
        const b = Math.round(lerp(230, 0, p.warmth));
        const puffGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        puffGrad.addColorStop(0,   `rgba(${r},${gb},${b},${p.a * opacity})`);
        puffGrad.addColorStop(0.6, `rgba(${r},${gb},${b},${p.a * opacity * 0.4})`);
        puffGrad.addColorStop(1,   `rgba(${r},${gb},${b},0)`);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!running) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const mid = window.scrollY + H * 0.5;
      const delta = clamp((mid - (lastMid || mid)) / 100, -1.2, 1.2);
      lastMid = mid;
      targetDir = delta >= 0 ? 1 : -1;
      dir = lerp(dir, targetDir, Math.min(1, dt * 8));

      let nearest = sectionTops[0] ?? 0;
      for (const top of sectionTops) {
        if (Math.abs(mid - top) < Math.abs(mid - nearest)) nearest = top;
      }
      const base = 0.06;
      const env = clamp(1 - Math.abs(mid - nearest) / (H * 0.55), 0, 1);
      const opacity = clamp(base + env * 0.9, 0, 1);

      ctx.clearRect(0, 0, W, H);

      if (opacity > 0.002) {
        if (currentMode === 'thor') {
          drawThorFrame(dt, opacity, now);
        } else {
          drawGear5Frame(dt, opacity);
        }
      }
    }

    function start() {
      running = true;
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function onResize() {
      resize(); measureSections();
    }

    onResize();
    start();

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Subscribe to mode changes so canvas switches style live
    const unsubMode = useModeStore.subscribe(
      (state) => { currentMode = state.mode; }
    );

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      unsubMode();
      cancelAnimationFrame(raf);
      c.remove();
    };
  }, [motionOn]);

  return null;
}
