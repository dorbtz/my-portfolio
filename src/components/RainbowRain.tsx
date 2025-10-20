// src/components/RainbowRain.tsx
import { useEffect, useRef } from "react";

/**
 * Bifröst Galaxy Rain (canvas underlay)
 * - No "rails" lines; fully organic rainbow streaks + nebula.
 * - Direction reacts to scroll (down -> forward, up -> reverse).
 * - Intensity swells near section boundaries (feels like a portal handoff).
 * - Starts/stops with global "thor-mode-change" and persists with localStorage.
 * - Fixed behind everything (z-index -1), pointer-events: none.
 */
export default function RainbowRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // remove duplicates from HMR
    document.querySelectorAll(".rain-underlay").forEach((n) => n.remove());

    const c = document.createElement("canvas");
    c.className = "rain-underlay";
    Object.assign(c.style, {
      position: "fixed",
      inset: "0",
      zIndex: "-1",
      pointerEvents: "none",
    } as CSSStyleDeclaration);
    document.body.appendChild(c);
    canvasRef.current = c;

    const ctx = c.getContext("2d", { alpha: true })!;
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, running = false, last = performance.now();

    // Section positions (for boundary bloom)
    let sectionTops: number[] = [];
    let lastMid = 0;

    // scroll → direction (+1 down, -1 up)
    let targetDir = 1;
    let dir = 1; // smoothed

    // ---- streak field ----
    type Streak = {
      x: number; y: number;
      len: number; thick: number;
      hue: number; a: number;
      vy: number;  // base speed
      wob: number; wobSpd: number; wobAmp: number;
    };
    const COUNT = 260;       // density (perf)
    const streaks: Streak[] = new Array(COUNT);

    const rnd  = (min: number, max: number) => Math.random() * (max - min) + min;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function seed(i: number, fromTop = true) {
      // spawn within a central corridor (Bifröst lane) but with some scatter
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

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.style.width = W + "px";
      c.style.height = H + "px";
      c.width = Math.floor(W * dpr);
      c.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = 0; i < COUNT; i++) seed(i, Math.random() < 0.5);
    }

    function measureSections() {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("main .section"));
      sectionTops = nodes.length ? nodes.map((el) => el.offsetTop) : [0];
    }

    // soft galaxy wash
    function nebula(o: number) {
      // big inner glow
      const g1 = ctx.createRadialGradient(
        W * 0.5, H * 0.6, Math.max(W, H) * 0.06,
        W * 0.5, H * 0.55, Math.max(W, H) * 0.9
      );
      g1.addColorStop(0.0, "rgba(140,190,255,0.15)");
      g1.addColorStop(0.4, "rgba(255,140,230,0.07)");
      g1.addColorStop(1.0, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = o * 0.9;
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // subtle star sprinkle
      ctx.globalAlpha = o * 0.25;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 30; i++) {
        const x = (i * 97) % (W + 120) - 60;
        const y = (i * 137) % Math.floor(H * 0.9);
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    // boundary bloom (like portal flare as you pass sections)
    let lastBloomIdx = -1;
    let lastBloomAt = 0;
    function bloom(intensity: number, now: number) {
      // pick nearest section
      const mid = window.scrollY + H * 0.5;
      let idx = 0, best = Infinity;
      for (let i = 0; i < sectionTops.length; i++) {
        const d = Math.abs(mid - sectionTops[i]);
        if (d < best) { best = d; idx = i; }
      }
      // rate limit flares
      if (idx === lastBloomIdx && now - lastBloomAt < 900) return;
      lastBloomIdx = idx; lastBloomAt = now;

      const y = clamp(sectionTops[idx] - window.scrollY, 0, H);
      const g = ctx.createRadialGradient(W * 0.5, y, 12, W * 0.5, y, Math.max(W, H) * 0.45);
      g.addColorStop(0.0, "rgba(255,255,255,0.20)");
      g.addColorStop(0.3, "rgba(120,210,255,0.20)");
      g.addColorStop(0.6, "rgba(160,120,255,0.10)");
      g.addColorStop(1.0, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(intensity, 0, 1) * 0.8;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    function gradientFor(x: number, y: number, len: number, hue: number, a: number) {
      const g = ctx.createLinearGradient(x, y - len / 2, x, y + len / 2);
      g.addColorStop(0.00, `hsla(${(hue + 20) % 360} 100% 72% / 0)`);
      g.addColorStop(0.25, `hsla(${(hue + 0) % 360} 100% 70% / ${a * 0.9})`);
      g.addColorStop(0.50, `hsla(${(hue + 60) % 360} 100% 65% / ${a})`);
      g.addColorStop(0.75, `hsla(${(hue + 100) % 360} 100% 60% / ${a * 0.9})`);
      g.addColorStop(1.00, `hsla(${(hue + 120) % 360} 100% 55% / 0)`);
      return g;
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!running) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const mid = window.scrollY + H * 0.5;
      const delta = clamp((mid - (lastMid || mid)) / 100, -1.2, 1.2); // scroll ease
      lastMid = mid;
      targetDir = delta >= 0 ? 1 : -1;
      // smooth toward target direction
      dir = lerp(dir, targetDir, Math.min(1, dt * 8));

      // envelope: stronger near section top/bottom handoffs
      let nearest = sectionTops[0];
      for (let i = 0; i < sectionTops.length; i++) {
        if (Math.abs(mid - sectionTops[i]) < Math.abs(mid - nearest)) nearest = sectionTops[i];
      }
      const base = 0.06;
      const env = clamp(1 - Math.abs(mid - nearest) / (H * 0.55), 0, 1);
      const opacity = clamp(base + env * 0.9, 0, 1);

      ctx.clearRect(0, 0, W, H);

      if (opacity > 0.002) {
        nebula(opacity);

        // occasional boundary bloom when very close
        if (env > 0.85) bloom(env, now);

        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < COUNT; i++) {
          const s = streaks[i];
          // move along vertical with wobble drift
          s.y += dir * s.vy * dt;
          s.x += Math.sin(s.wob) * s.wobAmp * dt * 0.5;
          s.wob += s.wobSpd * dt;
          s.hue = (s.hue + 50 * dt) % 360;

          // wrap around
          if (dir > 0 && s.y - s.len > H + 40) seed(i, true);      // moved down past bottom -> seed at top
          if (dir < 0 && s.y + s.len < -40) seed(i, false);         // moved up past top -> seed at bottom

          ctx.strokeStyle = gradientFor(s.x, s.y, s.len, s.hue, s.a * opacity);
          ctx.lineWidth = s.thick;
          ctx.beginPath();
          // slight tilt: draw as a short vertical segment with minimal curvature
          const y0 = s.y - s.len * 0.5, y1 = s.y + s.len * 0.5;
          ctx.moveTo(s.x, y0);
          ctx.lineTo(s.x, y1);
          ctx.stroke();

          // small halo
          ctx.globalAlpha = (s.a * opacity) * 0.15;
          ctx.fillStyle = `hsla(${(s.hue + 60) % 360} 100% 60% / 0.35)`;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.thick * 2.4, s.len * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    function start() {
      running = true;
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      const g = c.getContext("2d");
      if (g) g.clearRect(0, 0, c.width, c.height);
    }

    function onResize() {
      resize(); measureSections();
    }

    // init
    onResize();
    const initialOn = (() => {
      try { return localStorage.getItem("thor:mode") === "1"; } catch { return false; }
    })();
    if (initialOn) start(); else stop();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Thor mode toggle listener
    const onThor = (e: Event) => {
      const on = (e as CustomEvent<boolean>).detail;
      if (on) start(); else stop();
    };
    window.addEventListener("thor-mode-change", onThor as EventListener);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("thor-mode-change", onThor as EventListener);
      cancelAnimationFrame(raf);
      c.remove();
    };
  }, []);

  return null;
}
