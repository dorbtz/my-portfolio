import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import {
  EDUCATION,
  EMPLOYMENT,
  MILITARY,
  PROFILE,
  SKILL_GROUPS,
} from "@/shared/data/profile";

export function Resume() {
  return (
    <Section padding={9} ariaLabel="Resume">
      <AppleSpring kind="fade-up" trigger="mount">
        <p className="text-caption uppercase tracking-[0.18em] text-accent">Resume / CV</p>
        <h1 className="text-display font-bold tracking-tight mt-2">{PROFILE.name}</h1>
        <p className="text-h2 text-muted mt-2">{PROFILE.headline}</p>
        <div className="text-body-sm text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <a href={`mailto:${PROFILE.email}`} className="hover:text-accent">
            {PROFILE.email}
          </a>
          <span>·</span>
          <span>{PROFILE.location}</span>
          <span>·</span>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer noopener" className="hover:text-accent">
            LinkedIn
          </a>
          <span>·</span>
          <a href={PROFILE.github} target="_blank" rel="noreferrer noopener" className="hover:text-accent">
            GitHub
          </a>
        </div>
      </AppleSpring>

      <AppleSpring kind="fade-up" delay={80}>
        <GlassCard padding={6} className="mt-8">
          <h2 className="text-caption uppercase tracking-wider text-muted">Profile</h2>
          <p className="text-body mt-2">{PROFILE.bioLong}</p>
        </GlassCard>
      </AppleSpring>

      <AppleSpring kind="fade-up" delay={120}>
        <GlassCard padding={6} className="mt-6">
          <h2 className="text-caption uppercase tracking-wider text-muted">Experience</h2>
          <ul className="grid gap-6 mt-4">
            {EMPLOYMENT.map((job) => (
              <li key={`${job.title}-${job.org}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-h3 font-semibold">{job.title}</p>
                  <span className="text-caption text-muted">{job.period}</span>
                </div>
                <p className="text-body-sm text-accent mt-0.5">{job.org}</p>
                <ul className="list-disc ms-5 mt-2 space-y-1">
                  {job.bullets.map((b, i) => (
                    <li key={i} className="text-body-sm text-muted">
                      {b}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </GlassCard>
      </AppleSpring>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <AppleSpring kind="fade-up" delay={140}>
          <GlassCard padding={6} className="h-full">
            <h2 className="text-caption uppercase tracking-wider text-muted">Education</h2>
            <ul className="grid gap-4 mt-4">
              {EDUCATION.map((e) => (
                <li key={`${e.title}-${e.org}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-h3 font-semibold">{e.title}</p>
                    <span className="text-caption text-muted">{e.period}</span>
                  </div>
                  <p className="text-body-sm text-accent mt-0.5">{e.org}</p>
                  <ul className="list-disc ms-5 mt-2 space-y-1">
                    {e.bullets.map((b, i) => (
                      <li key={i} className="text-body-sm text-muted">
                        {b}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </GlassCard>
        </AppleSpring>
        <AppleSpring kind="fade-up" delay={160}>
          <GlassCard padding={6} className="h-full">
            <h2 className="text-caption uppercase tracking-wider text-muted">Military Service (IDF)</h2>
            <ul className="grid gap-4 mt-4">
              {MILITARY.map((m) => (
                <li key={`${m.title}-${m.org}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-h3 font-semibold">{m.title}</p>
                    <span className="text-caption text-muted">{m.period}</span>
                  </div>
                  <p className="text-body-sm text-accent mt-0.5">{m.org}</p>
                  <p className="text-body-sm text-muted mt-2">{m.description}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        </AppleSpring>
      </div>

      <AppleSpring kind="fade-up" delay={180}>
        <GlassCard padding={6} className="mt-6">
          <h2 className="text-caption uppercase tracking-wider text-muted">Skills</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {SKILL_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="text-body-sm font-semibold">{g.label}</p>
                <ul className="flex flex-wrap gap-1.5 mt-2">
                  {g.skills.map((s) => (
                    <li
                      key={s.name}
                      className="px-2 py-1 rounded-pill text-caption border border-line bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] text-fg"
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>
      </AppleSpring>
    </Section>
  );
}

/**
 * JSON-LD payload for /resume. Rendered as an inline <script type="application/ld+json"/>
 * so search engines understand the Person schema (job title, languages, skills, etc.).
 */
export function ResumeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    email: `mailto:${PROFILE.email}`,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorbtz.com",
    sameAs: [PROFILE.github, PROFILE.linkedin],
    jobTitle: PROFILE.headline,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Rehovot",
      addressCountry: "IL",
    },
    knowsLanguage: ["he", "en"],
    knowsAbout: SKILL_GROUPS.flatMap((g) => g.skills.map((s) => s.name)),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
