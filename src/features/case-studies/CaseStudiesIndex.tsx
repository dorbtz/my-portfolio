import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

const EYEBROW = "Long-form";
const TITLE = "Case studies";
const BODY =
  "MDX-powered deep dives on the architecture and engineering decisions behind selected projects. The MDX toolchain wires up in M4; the first long-form lands with Lumen.";
const SOON_TITLE = "Coming soon.";
const SOON_BODY =
  "Lumen — architecture, the taste-embedding pipeline, Why-Cards under the hood, what shipping a PWA on Turbopack taught me.";

export async function CaseStudiesIndex() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: EYEBROW, contentType: "case-studies.eyebrow" },
    { en: TITLE, contentType: "case-studies.title" },
    { en: BODY, contentType: "case-studies.body" },
    { en: SOON_TITLE, contentType: "case-studies.soon_title" },
    { en: SOON_BODY, contentType: "case-studies.soon_body" },
  ]);
  return (
    <Section padding={9} ariaLabel="Case studies">
      <AppleSpring kind="fade-up" trigger="mount">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(EYEBROW)}</p>
        <h1 className="text-display font-bold tracking-tight mt-2">{t(TITLE)}</h1>
        <p className="text-body text-muted mt-3 max-w-2xl">{t(BODY)}</p>
      </AppleSpring>
      <AppleSpring kind="fade-up" delay={120}>
        <GlassCard padding={6} className="mt-8 max-w-2xl">
          <p className="text-h3 font-semibold">{t(SOON_TITLE)}</p>
          <p className="text-body-sm text-muted mt-2">{t(SOON_BODY)}</p>
        </GlassCard>
      </AppleSpring>
    </Section>
  );
}
