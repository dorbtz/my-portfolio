"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type AppleSpringProps = {
  /** Animation kind. Defaults to "fade-up". */
  kind?: "fade" | "fade-up" | "fade-down" | "scale";
  /** Delay in ms. */
  delay?: number;
  /** Trigger on viewport enter (default) vs immediate on mount. */
  trigger?: "in-view" | "mount";
  className?: string;
  children: ReactNode;
};

const FROM: Record<string, string> = {
  fade: "opacity-0",
  "fade-up": "opacity-0 translate-y-3",
  "fade-down": "opacity-0 -translate-y-3",
  scale: "opacity-0 scale-[0.96]",
};

/**
 * Lightweight Apple-style entrance animation using CSS transitions + IntersectionObserver.
 * Honors prefers-reduced-motion: skips entrance, becomes a static wrapper.
 */
export function AppleSpring({
  kind = "fade-up",
  delay = 0,
  trigger = "in-view",
  className,
  children,
}: AppleSpringProps) {
  const [shown, setShown] = useState(trigger === "mount");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger !== "in-view") return;
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [trigger]);

  const from = FROM[kind] ?? FROM.fade;
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        "transition-all duration-[var(--duration-glide)] ease-[var(--ease-glide)] will-change-transform",
        shown ? "opacity-100 translate-y-0 translate-x-0 scale-100" : from,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
