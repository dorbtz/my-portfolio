import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { useThor } from "../state/thor";

/**
 * HammerHover
 * - Shows your hammer image following the cursor
 * - Visible only when Thor Mode is ON and hovering elements marked [data-thor-hover]
 * - Skips touch devices and honors prefers-reduced-motion
 */
export default function HammerHover() {
  const { on } = useThor();
  const reduced = useReducedMotion();
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    // Skip on touch devices entirely
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    if (coarse) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!on || reduced) {
          node.style.opacity = "0";
          return;
        }
        const target = e.target as HTMLElement | null;
        const actionable = target?.closest("[data-thor-hover]") as HTMLElement | null;
        if (!actionable) {
          node.style.opacity = "0";
          return;
        }
        node.style.opacity = "1";
        const dx = e.clientX + 10;
        const dy = e.clientY + 10;
        const rot = reduced ? 0 : -12;
        node.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [on, reduced]);

  return (
    <div
      ref={el}
      aria-hidden
      className="fixed left-0 top-0 z-[100] pointer-events-none transition-opacity duration-150 ease-out"
      style={{ opacity: 0 }}
    >
      {/* hammer image */}
      <img
        src="/assets/mjolnir.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 select-none"
        draggable={false}
      />
      {/* tiny electric spark (kept subtle) */}
      <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full animate-ping bg-[rgb(var(--color-lightning))]"></div>
    </div>
  );
}
