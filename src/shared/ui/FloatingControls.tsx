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
      className={[
        "fixed z-50 flex items-center gap-2",
        "top-[max(env(safe-area-inset-top),0.75rem)]",
        "end-[max(env(safe-area-inset-right),0.75rem)]",
        // Mobile: stack tightly. Desktop: row.
        "flex-wrap justify-end max-w-[calc(100vw-1.5rem)]",
      ].join(" ")}
      aria-label="Site controls"
    >
      <ThemeSwitcher initialTheme={initialTheme} initialScheme={initialScheme} />
      <LangSwitcher initialLocale={initialLocale} />
    </div>
  );
}
