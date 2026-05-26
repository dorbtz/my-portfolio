"use client";

import { ThemeSwitcher } from "./ThemeSwitcher";
import { LangSwitcher } from "./LangSwitcher";
import type { ColorScheme, Locale, Theme } from "../lib/theme/types";

type Props = {
  initialTheme: Theme;
  initialScheme: ColorScheme;
  initialLocale: Locale;
};

/**
 * Top-right floating cluster: theme + scheme + language.
 * Sits above content via fixed positioning + safe-area-aware insets.
 */
export function FloatingControls({ initialTheme, initialScheme, initialLocale }: Props) {
  return (
    <div
      // dir="ltr" pins the cluster's internal layout regardless of page direction —
      // the site-control surface always reads left-to-right, like an OS control center.
      // Anchored with physical `right-*` so it stays on the right edge even in RTL pages.
      // On very small screens (iPhone SE etc.) the cluster stacks vertically so
      // both pills always fit inside the viewport's max-width budget.
      dir="ltr"
      className={[
        "fixed z-50 flex items-end sm:items-center gap-2",
        "top-[max(env(safe-area-inset-top),0.75rem)]",
        "right-[max(env(safe-area-inset-right),0.75rem)]",
        "max-w-[calc(100vw-1.5rem)]",
        // Stack vertically below sm, side-by-side above. flex-wrap is the
        // safety net for in-between widths where horizontal still fits.
        "flex-col sm:flex-row sm:flex-wrap sm:justify-end",
      ].join(" ")}
      aria-label="Site controls"
    >
      <ThemeSwitcher initialTheme={initialTheme} initialScheme={initialScheme} />
      <LangSwitcher initialLocale={initialLocale} />
    </div>
  );
}
