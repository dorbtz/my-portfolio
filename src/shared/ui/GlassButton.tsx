import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost";
type Size = "sm" | "md" | "lg";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-11 px-5 text-body",
  lg: "h-12 px-6 text-body",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton({ variant = "primary", size = "md", className, ...rest }, ref) {
    const base =
      "glass-button inline-flex items-center justify-center gap-2 rounded-pill font-medium select-none " +
      "transition-[transform,box-shadow,background-color,color] ease-snap duration-snap " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] " +
      "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed " +
      "min-h-[44px] min-w-[44px]"; // a11y tap target
    const v =
      variant === "primary"
        ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:brightness-110"
        : "bg-transparent text-[var(--color-text)] hover:bg-[var(--glass-bg)]";
    return <button ref={ref} className={[base, v, SIZE[size], className].filter(Boolean).join(" ")} {...rest} />;
  }
);
