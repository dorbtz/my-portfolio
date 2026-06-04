import Link from "next/link";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";
import { ThemeSwitcher } from "@/shared/ui/ThemeSwitcher";
import { LangSwitcher } from "@/shared/ui/LangSwitcher";
import { SoundToggle } from "@/shared/ui/SoundToggle";

export async function Header() {
  const { theme, scheme, locale } = await readThemeState();
  const t = getChromeStrings(locale);

  const nav = [
    { label: t.nav.work, href: "/#projects" },
    { label: t.nav.about, href: "/#about" },
    { label: t.nav.skills, href: "/#skills" },
    { label: t.nav.playground, href: "/playground" },
    { label: t.nav.resume, href: "/resume" },
  ];

  return (
    <header
      // dir="ltr" pins the header layout so the wordmark stays left and
      // nav stays right in every locale. Individual <Link> children still
      // render their label text in whatever script the locale uses (e.g.
      // עברית for HE) — short labels render correctly inside an LTR
      // container, and the brand wordmark "dorbtz" is Latin-only.
      dir="ltr"
      className="w-full sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--color-bg)_75%,transparent)] border-b border-line"
    >
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto h-14 sm:h-16 grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link
          href="/"
          className="font-semibold tracking-tight text-fg hover:text-accent transition-colors duration-snap justify-self-start shrink-0"
        >
          dor<span className="text-accent">b</span>tz
        </Link>
        <nav
          aria-label={t.a11y.primaryNav}
          // Horizontal scroll on mobile when 5 items + HE labels exceed the
          // available width (iPhone SE @ 320px). Hidden scrollbar + snap.
          className="flex items-center gap-0.5 sm:gap-2 sm:justify-self-center overflow-x-auto no-scrollbar -mx-2 px-2"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-2 sm:px-3 py-2 rounded-pill text-caption sm:text-body-sm font-medium text-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] transition-colors duration-snap min-h-[44px] inline-flex items-center whitespace-nowrap shrink-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Right slot. On large screens it holds the site controls inline so
            they sit IN the header bar instead of floating on top of it (the
            old fixed top-right cluster overlapped the header on desktop).
            Below lg the slot is an empty spacer that keeps the centered nav
            balanced — the collapsed ⚙ settings menu (FloatingControls) takes
            over there. The cluster is wide (~400px) so it only fits inline at
            lg+; sm–lg falls back to the ⚙ menu. */}
        <div
          // ltr so EN/עב buttons keep their order in HE mode
          dir="ltr"
          className="hidden lg:flex items-center gap-2 justify-self-end"
          aria-label={t.a11y.siteControls}
        >
          <ThemeSwitcher initialTheme={theme} initialScheme={scheme} />
          <LangSwitcher initialLocale={locale} />
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}
