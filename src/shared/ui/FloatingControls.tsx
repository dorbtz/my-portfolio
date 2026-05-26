"use client";

import { ThemeSwitcher } from "./ThemeSwitcher";
import { LangSwitcher } from "./LangSwitcher";
import { SoundToggle } from "./SoundToggle";
import { MobileSettingsMenu } from "./MobileSettingsMenu";
import type { ColorScheme, Locale, Theme } from "../lib/theme/types";

type Props = {
  initialTheme: Theme;
  initialScheme: ColorScheme;
  initialLocale: Locale;
};

/**
 * Top-right floating site controls.
 *
 * Desktop (sm+): full horizontal pill cluster — Theme + Lang + Sound visible
 *   inline, anchored top-right where the header's max-w-1200 layout leaves
 *   empty right margin.
 *
 * Mobile (< sm): COLLAPSED into a single glass ⚙ icon button below the
 *   sticky header. Tapping it opens a panel with the same controls grouped
 *   under short labels (Theme / Language / Sound). Stops the stacked-pills
 *   tower from overlapping hero content + nav, which was the bug.
 */
export function FloatingControls({ initialTheme, initialScheme, initialLocale }: Props) {
  return (
    <>
      {/* Mobile: collapsed icon → menu */}
      <div
        dir="ltr"
        className={[
          "sm:hidden fixed z-50",
          "top-[calc(env(safe-area-inset-top,0px)+3.75rem)]",
          "right-[max(env(safe-area-inset-right),0.75rem)]",
        ].join(" ")}
        aria-label="Site controls"
      >
        <MobileSettingsMenu
          initialTheme={initialTheme}
          initialScheme={initialScheme}
          initialLocale={initialLocale}
        />
      </div>

      {/* Desktop: inline pill cluster */}
      <div
        dir="ltr"
        className={[
          "hidden sm:flex fixed z-50 items-center gap-2",
          "top-[max(env(safe-area-inset-top),0.75rem)]",
          "right-[max(env(safe-area-inset-right),0.75rem)]",
          "max-w-[calc(100vw-1.5rem)]",
          "flex-wrap justify-end",
        ].join(" ")}
        aria-label="Site controls"
      >
        <ThemeSwitcher initialTheme={initialTheme} initialScheme={initialScheme} />
        <LangSwitcher initialLocale={initialLocale} />
        <SoundToggle />
      </div>
    </>
  );
}
