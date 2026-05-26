import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { ABOUT } from "@/shared/data/sections";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";
import { CastStrip } from "./CastStrip";
import { ThemeArtStrip } from "./ThemeArtStrip";

export async function About() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: ABOUT.eyebrow, contentType: "about.eyebrow" },
    { en: ABOUT.title, contentType: "about.title" },
    { en: ABOUT.body, contentType: "about.body" },
    ...ABOUT.highlights.flatMap((h) => [
      { en: h.title, contentType: "about.highlight.title" },
      { en: h.body, contentType: "about.highlight.body" },
    ]),
  ]);
  return (
    <Section id="about" ariaLabel="About">
      <AppleSpring kind="fade-up">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(ABOUT.eyebrow)}</p>
        <h2 className="text-h1 font-bold mt-2 max-w-3xl">{t(ABOUT.title)}</h2>
        <p className="text-body text-muted mt-4 max-w-3xl">{t(ABOUT.body)}</p>
      </AppleSpring>
      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        {ABOUT.highlights.map((h, i) => (
          <AppleSpring key={h.title} kind="fade-up" delay={120 + i * 80}>
            <GlassCard padding={5} className="h-full">
              <p className="text-h3 font-semibold">{t(h.title)}</p>
              <p className="text-body-sm text-muted mt-2">{t(h.body)}</p>
            </GlassCard>
          </AppleSpring>
        ))}
      </div>
      {/* Decorative cast strip — Avengers icons in Thor / Straw Hat in Luffy. */}
      <CastStrip />
      {/* Large character art line-up — Avengers PNGs (Thor) or WANTED-poster
          board (Luffy). Adds real fandom artwork to the page; renders nothing
          for the HighTech default. */}
      <ThemeArtStrip />
    </Section>
  );
}
