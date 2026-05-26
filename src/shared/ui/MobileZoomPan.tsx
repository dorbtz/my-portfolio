"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Mobile-only pinch-zoom + drag wrapper.  Renders children unchanged on
 * desktop / fine-pointer devices; on coarse-pointer (touch) devices it
 * intercepts two-finger gestures for zoom and single-finger drag for pan,
 * applying a CSS transform to the whole subtree so any percentage-
 * positioned markers / labels scale + translate together (their relative
 * positions stay locked).
 *
 * Tap / click on a marker still works — single-pointer events at scale = 1
 * are NOT intercepted, so React's onClick fires normally.  Pan kicks in
 * only after the user pinches to zoom (scale > 1).
 *
 * Tiny "Pinch to zoom" hint shows on first viewing; a "Reset" pill replaces
 * it once zoomed so the user always has a one-tap way home.
 */

const TOUCH_QUERY = "(pointer: coarse)";
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const TAP_SLOP_PX = 8; // pointer movement under this counts as a tap, not a pan

type Transform = { scale: number; tx: number; ty: number };
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(TOUCH_QUERY);
      mq.addEventListener?.("change", cb);
      return () => mq.removeEventListener?.("change", cb);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(TOUCH_QUERY).matches
        : false,
    () => false
  );
}

export function MobileZoomPan({
  children,
  hint,
  resetLabel = "Reset",
  className,
  style,
}: {
  children: ReactNode;
  hint?: string;
  resetLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isTouch = useIsTouchDevice();
  const outerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>(IDENTITY);
  // `interacting` lives in state so the render can read it (refs can't be
  // accessed during render per react-hooks/refs). Used to disable the CSS
  // transition while a gesture is in flight so the transform tracks the
  // pointer crisply, then re-enable on release for a soft bounce-back.
  const [interacting, setInteracting] = useState(false);
  // Pointer tracker — id → last { x, y }
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  const lastDist = useRef(0);
  const lastMid = useRef({ x: 0, y: 0 });

  const clamp = useCallback((next: Transform): Transform => {
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next.scale));
    if (!outerRef.current) return { ...next, scale };
    const rect = outerRef.current.getBoundingClientRect();
    // Allow pan within the EXTRA space the zoom created — never past the
    // edge in either direction.
    const maxTx = Math.max(0, (rect.width * (scale - 1)) / 2);
    const maxTy = Math.max(0, (rect.height * (scale - 1)) / 2);
    return {
      scale,
      tx: Math.max(-maxTx, Math.min(maxTx, next.tx)),
      ty: Math.max(-maxTy, Math.min(maxTy, next.ty)),
    };
  }, []);

  const reset = useCallback(() => setT(IDENTITY), []);

  // Re-clamp on resize so a zoomed map doesn't end up off-screen.
  useEffect(() => {
    const onResize = () => setT((prev) => clamp(prev));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  // iOS Safari ignores `touch-action: none` for the OS-level pinch-zoom
  // gesture — it still triggers page zoom unless you preventDefault on the
  // native touchmove/gesture events. React's synthetic pointer events
  // can't preventDefault on these (Safari fires them passively). Bind
  // raw listeners on the outer element with { passive: false } so the
  // pinch stays inside the map. Multi-touch only — single-finger taps
  // still bubble normally so marker clicks keep working.
  useEffect(() => {
    if (!isTouch) return;
    const el = outerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };
    const onGesture = (e: Event) => e.preventDefault();
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("gesturestart", onGesture as EventListener, { passive: false });
    el.addEventListener("gesturechange", onGesture as EventListener, { passive: false });
    el.addEventListener("gestureend", onGesture as EventListener, { passive: false });
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("gesturestart", onGesture as EventListener);
      el.removeEventListener("gesturechange", onGesture as EventListener);
      el.removeEventListener("gestureend", onGesture as EventListener);
    };
  }, [isTouch]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTouch) return;
    pointers.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    });
    setInteracting(true);
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      lastDist.current = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      lastMid.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isTouch) return;
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: prev.startX,
      startY: prev.startY,
    });

    if (pointers.current.size === 2) {
      // Pinch — derive new scale + midpoint
      const [p1, p2] = [...pointers.current.values()];
      const newDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const newMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const delta = newDist / (lastDist.current || newDist);
      setT((cur) =>
        clamp({
          scale: cur.scale * delta,
          tx: cur.tx + (newMid.x - lastMid.current.x),
          ty: cur.ty + (newMid.y - lastMid.current.y),
        })
      );
      lastDist.current = newDist;
      lastMid.current = newMid;
      e.preventDefault();
    } else if (pointers.current.size === 1) {
      // Single pointer — only pan when zoomed AND moved past tap slop
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const total = Math.hypot(e.clientX - prev.startX, e.clientY - prev.startY);
      if (t.scale > 1.01 && total > TAP_SLOP_PX) {
        setT((cur) => clamp({ scale: cur.scale, tx: cur.tx + dx, ty: cur.ty + dy }));
        e.preventDefault();
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setInteracting(false);
  };

  // Desktop: render children directly; no wrapper, no transform, no hint.
  if (!isTouch) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const zoomed = t.scale > 1.01;

  return (
    <div
      ref={outerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ ...style, touchAction: "none" }}
    >
      {/* Inner gets `absolute inset-0` so it inherits the outer's size
          (without it the transform context exists but has 0 × 0 box, so
          children using `absolute inset-0` resolve to nothing and the
          map renders blank with floating markers — the bug the user
          reported as "messed islands"). */}
      <div
        className="absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`,
          transformOrigin: "center center",
          transition: interacting ? "none" : "transform 220ms ease",
          touchAction: "none",
          willChange: zoomed ? "transform" : undefined,
        }}
      >
        {children}
      </div>

      {/* Bottom-centre hint (when not zoomed) */}
      {!zoomed && hint && (
        <div
          aria-hidden
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-caption px-3 py-1 rounded-full pointer-events-none"
          style={{
            background: "color-mix(in oklab, var(--color-bg) 85%, transparent)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            backdropFilter: "blur(6px)",
          }}
        >
          {hint}
        </div>
      )}

      {/* Top-right Reset pill (when zoomed) */}
      {zoomed && (
        <button
          type="button"
          onClick={reset}
          className="absolute top-2 right-2 text-caption font-medium px-3 py-1 rounded-full z-10"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-accent-contrast)",
            border: "1px solid color-mix(in oklab, var(--color-text) 25%, transparent)",
            boxShadow: "0 4px 12px -4px rgba(0,0,0,0.4)",
          }}
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
