import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";
import { Section } from "@/shared/ui/Section";
import { AppleSpring } from "@/shared/ui/AppleSpring";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <Section padding={10}>
        <AppleSpring kind="fade-up" trigger="mount">
          <GlassCard padding={8} className="max-w-2xl mx-auto text-center">
            <p className="text-caption uppercase tracking-[0.18em] text-muted mb-3">
              Portfolio v2 · M2 — theme system live
            </p>
            <h1 className="text-display font-bold leading-[1.05] tracking-[-0.02em]">
              Dor Ben Tzur
            </h1>
            <p className="text-body text-muted mt-3 max-w-prose mx-auto">
              Full-Stack &amp; AI Engineer. Try the theme switcher in the top
              right — same data, three Apple Liquid Glass skins, light or dark
              or auto. Hebrew toggle wires up the translation pipeline in M6.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <GlassButton variant="primary">Get in touch</GlassButton>
              <a
                href="https://github.com/dorbtz/my-portfolio/blob/v2-hightech/SPEC.md"
                className="glass-button inline-flex items-center justify-center gap-2 rounded-pill font-medium select-none h-11 px-5 text-body min-h-[44px] min-w-[44px] hover:bg-[var(--glass-bg)] text-fg no-underline transition-[transform,background-color] duration-snap ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] active:scale-[0.97]"
              >
                See SPEC
              </a>
            </div>
          </GlassCard>
        </AppleSpring>

        <AppleSpring kind="fade-up" delay={120}>
          <div className="grid gap-4 sm:grid-cols-3 mt-8 sm:mt-12 max-w-4xl mx-auto">
            <GlassCard padding={5}>
              <p className="text-caption uppercase tracking-wider text-accent">High-Tech</p>
              <p className="text-h3 font-semibold mt-1">Apple Liquid Glass</p>
              <p className="text-body-sm text-muted mt-2">
                The default. Cinematic, restrained, AI-forward. Light + dark.
              </p>
            </GlassCard>
            <GlassCard padding={5}>
              <p className="text-caption uppercase tracking-wider text-accent">Thor</p>
              <p className="text-h3 font-semibold mt-1">Asgardian dossier</p>
              <p className="text-body-sm text-muted mt-2">
                Bifrost blue in light, Mjolnir gold in dark. Lightning easter
                egg restored in M8.
              </p>
            </GlassCard>
            <GlassCard padding={5}>
              <p className="text-caption uppercase tracking-wider text-accent">Luffy</p>
              <p className="text-h3 font-semibold mt-1">Pirate wanted poster</p>
              <p className="text-body-sm text-muted mt-2">
                Parchment cream + Wanted red. Straw-hat-rain easter egg
                restored in M8.
              </p>
            </GlassCard>
          </div>
        </AppleSpring>
      </Section>
    </main>
  );
}
