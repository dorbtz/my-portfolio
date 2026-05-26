import Link from "next/link";
import { GlassButton } from "@/shared/ui/GlassButton";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { HERO } from "@/shared/data/sections";

export function Hero() {
  return (
    <Section id="hero" padding={10} ariaLabel="Introduction">
      {/* hero-bg supplies theme-specific background patterns + watermark via CSS */}
      <div className="hero-bg">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent text-center">
            {HERO.eyebrow}
          </p>
          <h1 className="text-display font-bold tracking-tight mt-3 text-center max-w-4xl mx-auto">
            {HERO.headline}
          </h1>
          <p className="text-body text-muted mt-5 max-w-2xl mx-auto text-center">
            {HERO.subhead}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <Link href={HERO.ctaPrimary.href}>
              <GlassButton variant="primary" size="lg">
                {HERO.ctaPrimary.label}
              </GlassButton>
            </Link>
            <Link href={HERO.ctaSecondary.href}>
              <GlassButton variant="ghost" size="lg">
                {HERO.ctaSecondary.label}
              </GlassButton>
            </Link>
          </div>
        </AppleSpring>
      </div>
    </Section>
  );
}
