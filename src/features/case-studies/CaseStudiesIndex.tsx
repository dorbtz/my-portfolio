import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";

export function CaseStudiesIndex() {
  return (
    <Section padding={9} ariaLabel="Case studies">
      <AppleSpring kind="fade-up" trigger="mount">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">Long-form</p>
        <h1 className="text-display font-bold tracking-tight mt-2">Case studies</h1>
        <p className="text-body text-muted mt-3 max-w-2xl">
          MDX-powered deep dives on the architecture and engineering decisions
          behind selected projects. The MDX toolchain wires up in M4; the first
          long-form lands with Lumen.
        </p>
      </AppleSpring>

      <AppleSpring kind="fade-up" delay={120}>
        <GlassCard padding={6} className="mt-8 max-w-2xl">
          <p className="text-h3 font-semibold">Coming soon.</p>
          <p className="text-body-sm text-muted mt-2">
            Lumen — architecture, the taste-embedding pipeline, Why-Cards under
            the hood, what shipping a PWA on Turbopack taught me.
          </p>
        </GlassCard>
      </AppleSpring>
    </Section>
  );
}
