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
      dir="ltr"
      className={[
        "fixed z-50 flex items-center gap-2",
        "top-[max(env(safe-area-inset-top),0.75rem)]",
        "right-[max(env(safe-area-inset-right),0.75rem)]",
        "flex-wrap justify-end max-w-[calc(100vw-1.5rem)]",
      ].join(" ")}
      aria-label="Site controls"
    >
      <ThemeSwitcher initialTheme={initialTheme} initialScheme={initialScheme} />
      <LangSwitcher initialLocale={initialLocale} />
    </div>
  );
}
