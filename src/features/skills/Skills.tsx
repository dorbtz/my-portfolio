import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { SKILL_GROUPS } from "@/shared/data/profile";

export function Skills() {
  return (
    <Section id="skills" ariaLabel="Skills">
      <AppleSpring kind="fade-up">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">Stack</p>
        <h2 className="text-h1 font-bold mt-2">What I work with.</h2>
        <p className="text-body text-muted mt-3 max-w-2xl">
          Daily-driver tools and the things I reach for first. Curated, not
          exhaustive — chips reflect actual recent use, not a degree-by-degree
          inventory.
        </p>
      </AppleSpring>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {SKILL_GROUPS.map((group, gi) => (
          <AppleSpring key={group.id} kind="fade-up" delay={80 + gi * 60}>
            <GlassCard padding={5} className="h-full">
              <p className="text-caption uppercase tracking-wider text-muted">
                {group.label}
              </p>
              <ul className="flex flex-wrap gap-2 mt-3">
                {group.skills.map((s) => (
                  <li
                    key={s.name}
                    className="px-3 py-1.5 rounded-pill text-body-sm border border-line bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] text-fg"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </AppleSpring>
        ))}
      </div>
    </Section>
  );
}
