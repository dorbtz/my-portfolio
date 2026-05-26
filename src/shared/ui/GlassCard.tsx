import { type ElementType, type ComponentPropsWithoutRef } from "react";

type GlassCardProps<T extends ElementType = "div"> = {
  as?: T;
  /** padding scale (1-8). Defaults to 6 (32px). */
  padding?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "padding" | "className" | "children">;

const PAD: Record<number, string> = {
  1: "p-1",
  2: "p-2",
  3: "p-3",
  4: "p-4",
  5: "p-5",
  6: "p-6 sm:p-7",
  7: "p-7 sm:p-8",
  8: "p-8 sm:p-9",
};

/**
 * Apple Liquid Glass surface. Uses theme tokens; works in every theme + scheme.
 * Backdrop-filter degrades to a near-solid surface on browsers without support.
 */
export function GlassCard<T extends ElementType = "div">({
  as,
  padding = 6,
  className,
  children,
  ...rest
}: GlassCardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={["glass", PAD[padding], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
