import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { ABOUT } from "@/shared/data/sections";

export function About() {
  return (
    <Section id="about" ariaLabel="About">
      <AppleSpring kind="fade-up">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">{ABOUT.eyebrow}</p>
        <h2 className="text-h1 font-bold mt-2 max-w-3xl">{ABOUT.title}</h2>
        <p className="text-body text-muted mt-4 max-w-3xl">{ABOUT.body}</p>
      </AppleSpring>
      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        {ABOUT.highlights.map((h, i) => (
          <AppleSpring key={h.title} kind="fade-up" delay={120 + i * 80}>
            <GlassCard padding={5} className="h-full">
              <p className="text-h3 font-semibold">{h.title}</p>
              <p className="text-body-sm text-muted mt-2">{h.body}</p>
            </GlassCard>
          </AppleSpring>
        ))}
      </div>
    </Section>
  );
}
