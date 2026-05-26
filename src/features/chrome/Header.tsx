import Link from "next/link";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";

export async function Header() {
  const { locale } = await readThemeState();
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
        {/* Right-side spacer keeps the centered nav truly centered on desktop.
            Hidden on mobile so the nav can use the full row width. */}
        <div aria-hidden className="hidden sm:block justify-self-end" />
      </div>
    </header>
  );
}
