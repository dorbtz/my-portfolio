// src/components/Section.tsx
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  id?: string;
  className?: string;
  label?: string;
}>;

/**
 * Section
 * - Provides centered ".wrap"
 * - Automatically reveals any ".reveal" children on first intersection
 * - Adds a small bottom margin for anchor scrolling comfort via CSS (scroll-margin handled in index.css)
 */
export default function Section({ id, className = "", label, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} className={`section ${className}`} data-section>
      <div className="wrap section-inner">
        {label ? (
          <p className="section-label sr-only" data-section-label>
            {label}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
