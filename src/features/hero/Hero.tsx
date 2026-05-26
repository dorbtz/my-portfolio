import Link from "next/link";
import { GlassButton } from "@/shared/ui/GlassButton";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { HERO } from "@/shared/data/sections";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";
import { ThemeHeroPanel } from "./ThemeHeroPanel";

export async function Hero() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: HERO.eyebrow, contentType: "hero.eyebrow" },
    { en: HERO.headline, contentType: "hero.headline" },
    { en: HERO.subhead, contentType: "hero.subhead" },
    { en: HERO.ctaPrimary.label, contentType: "hero.cta.primary" },
    { en: HERO.ctaSecondary.label, contentType: "hero.cta.secondary" },
  ]);
  return (
    <Section id="hero" padding={10} ariaLabel="Introduction">
      {/* hero-bg supplies theme-specific background patterns + watermark via CSS */}
      <div className="hero-bg">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent text-center">
            {t(HERO.eyebrow)}
          </p>
          <h1 className="text-display font-bold tracking-tight mt-3 text-center max-w-4xl mx-auto">
            {t(HERO.headline)}
          </h1>
          <p className="text-body text-muted mt-5 max-w-2xl mx-auto text-center">
            {t(HERO.subhead)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <Link href={HERO.ctaPrimary.href}>
              <GlassButton variant="primary" size="lg">
                {t(HERO.ctaPrimary.label)}
              </GlassButton>
            </Link>
            <Link href={HERO.ctaSecondary.href}>
              <GlassButton variant="ghost" size="lg">
                {t(HERO.ctaSecondary.label)}
              </GlassButton>
            </Link>
          </div>
          {/* Per-theme decorative hero centerpiece — manga Devil Fruit panel
              (Luffy) or Mjolnir + Bifrost disc (Thor). Renders nothing for
              the HighTech default. Client component so it hot-swaps with
              the floating theme switcher without a page refresh. */}
          <ThemeHeroPanel />
        </AppleSpring>
      </div>
    </Section>
  );
}
