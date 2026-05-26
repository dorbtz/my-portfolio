import { type ReactNode } from "react";

type SectionProps = {
  id?: string;
  ariaLabel?: string;
  children: ReactNode;
  /** Vertical padding scale (default: 9 = 96px) */
  padding?: 6 | 7 | 8 | 9 | 10;
  className?: string;
};

const PAD: Record<number, string> = {
  6: "py-8 sm:py-12",
  7: "py-12 sm:py-16",
  8: "py-16 sm:py-20",
  9: "py-20 sm:py-24",
  10: "py-24 sm:py-32",
};

/** Page section with consistent max-width + responsive padding. */
export function Section({ id, ariaLabel, children, padding = 9, className }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={[
        "w-full mx-auto",
        "max-w-[min(1200px,calc(100%-2rem))]",
        PAD[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
