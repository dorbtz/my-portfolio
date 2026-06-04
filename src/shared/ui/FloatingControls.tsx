"use client";

import { usePathname } from "next/navigation";
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
 * Site controls that live OUTSIDE the public header.
 *
 * On public routes the desktop (lg+) cluster is rendered INSIDE the header
 * bar (see features/chrome/Header) so it no longer floats on top of the
 * header. This component therefore only provides:
 *
 *   1. The collapsed ⚙ settings menu (below lg, on every route) — anchored
 *      below the sticky header. Covers phones + tablets.
 *   2. A floating desktop (lg+) cluster ONLY on routes that have no public
 *      header — i.e. /admin and /auth, whose own chrome reserves a top-right
 *      slot (lg) for exactly this cluster.
 */
export function FloatingControls({ initialTheme, initialScheme, initialLocale }: Props) {
  const pathname = usePathname() ?? "/";
  const hasPublicHeader = !(pathname.startsWith("/admin") || pathname.startsWith("/auth/"));

  return (
    <>
      {/* Below lg: collapsed icon → menu (every route). Sits below the sticky
          header — extra top offset at sm+ where the header is taller (h-16). */}
      <div
        dir="ltr"
        className={[
          "lg:hidden fixed z-50",
          "top-[calc(env(safe-area-inset-top,0px)+3.75rem)]",
          "sm:top-[calc(env(safe-area-inset-top,0px)+4.75rem)]",
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

      {/* lg+ floating cluster — only where there is NO public header (admin /
          auth). Public routes render the same cluster inline in the header. */}
      {!hasPublicHeader && (
        <div
          dir="ltr"
          className={[
            "hidden lg:flex fixed z-50 items-center gap-2",
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
      )}
    </>
  );
}
