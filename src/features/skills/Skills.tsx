import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { SKILL_GROUPS } from "@/shared/data/profile";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

const SKILLS_EYEBROW = "Stack";
const SKILLS_TITLE = "What I work with.";
const SKILLS_BODY =
  "Daily-driver tools and the things I reach for first. Curated, not exhaustive — chips reflect actual recent use, not a degree-by-degree inventory.";

export async function Skills() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: SKILLS_EYEBROW, contentType: "skills.eyebrow" },
    { en: SKILLS_TITLE, contentType: "skills.title" },
    { en: SKILLS_BODY, contentType: "skills.body" },
    ...SKILL_GROUPS.map((g) => ({ en: g.label, contentType: "skills.group" })),
    // Note: individual skill chips (TypeScript, React, etc.) are brand/tech
    // names — pinned to EN by the translation prompt's glossary. We don't
    // pass them through localize() to save Gemini calls.
  ]);
  return (
    <Section id="skills" ariaLabel="Skills">
      {/* skills-section is targeted by per-theme CSS for the Yggdrasil tree
          (Thor) and Grand Line ocean (Luffy) backdrops. */}
      <div className="skills-section relative">
        <AppleSpring kind="fade-up">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(SKILLS_EYEBROW)}</p>
          <h2 className="text-h1 font-bold mt-2">{t(SKILLS_TITLE)}</h2>
          <p className="text-body text-muted mt-3 max-w-2xl">{t(SKILLS_BODY)}</p>
        </AppleSpring>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8 relative z-10">
          {SKILL_GROUPS.map((group, gi) => (
            <AppleSpring key={group.id} kind="fade-up" delay={80 + gi * 60}>
              <GlassCard padding={5} className="skill-card h-full" data-skill-index={gi}>
                <p className="text-caption uppercase tracking-wider text-muted">
                  {t(group.label)}
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
      </div>
    </Section>
  );
}
