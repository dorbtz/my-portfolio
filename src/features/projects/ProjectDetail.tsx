import Link from "next/link";
import type { Project } from "@/types/project";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";
import { localize } from "@/shared/lib/i18n/localize";

export async function ProjectDetail({ project }: { project: Project }) {
  const { locale } = await readThemeState();
  const chrome = getChromeStrings(locale);
  const t = await localize(locale, [
    { en: project.tagline, contentType: `project:${project.slug}.tagline` },
    { en: project.problem, contentType: `project:${project.slug}.problem` },
    { en: project.role, contentType: `project:${project.slug}.role` },
    { en: project.writeup, contentType: `project:${project.slug}.writeup` },
  ]);

  return (
    <Section padding={9} ariaLabel={project.title}>
      <AppleSpring kind="fade-up" trigger="mount">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-body-sm text-muted hover:text-accent transition-colors"
        >
          <span aria-hidden>←</span> {chrome.common.allProjects}
        </Link>

        <div className="mt-6">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">
            {chrome.status[project.status]}
          </p>
          <h1 className="text-display font-bold tracking-tight mt-2">{project.title}</h1>
          <p className="text-h2 text-muted mt-3 max-w-3xl">{t(project.tagline)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer noopener">
              <GlassButton variant="primary">{chrome.common.visitLive}</GlassButton>
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer noopener">
              <GlassButton variant="ghost">{chrome.common.sourceOnGithub}</GlassButton>
            </a>
          )}
        </div>
      </AppleSpring>

      <div className="grid gap-6 lg:grid-cols-3 mt-10">
        <AppleSpring kind="fade-up" delay={120} className="lg:col-span-2">
          <GlassCard padding={7}>
            {project.problem && (
              <div>
                <h2 className="text-h3 font-semibold">{chrome.common.theProblem}</h2>
                <p className="text-body text-muted mt-2">{t(project.problem)}</p>
              </div>
            )}
            {project.role && (
              <div className="mt-6">
                <h2 className="text-h3 font-semibold">{chrome.common.myRole}</h2>
                <p className="text-body text-muted mt-2">{t(project.role)}</p>
              </div>
            )}
            {project.writeup && (
              <div className="mt-6">
                <h2 className="text-h3 font-semibold">{chrome.common.whatItDoes}</h2>
                <p className="text-body text-muted mt-2 whitespace-pre-wrap">
                  {t(project.writeup)}
                </p>
              </div>
            )}
          </GlassCard>
        </AppleSpring>

        <AppleSpring kind="fade-up" delay={180}>
          <GlassCard padding={5} className="h-full">
            {project.stack.length > 0 && (
              <>
                <p className="text-caption uppercase tracking-wider text-muted">{chrome.common.stack}</p>
                <ul className="flex flex-wrap gap-2 mt-3">
                  {project.stack.map((s) => (
                    <li
                      key={s}
                      className="px-2.5 py-1 rounded-pill text-caption border border-line bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] text-fg"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {project.tags.length > 0 && (
              <div className="mt-6">
                <p className="text-caption uppercase tracking-wider text-muted">{chrome.common.tags}</p>
                <ul className="flex flex-wrap gap-2 mt-3">
                  {project.tags.map((tag) => (
                    <li key={tag} className="text-caption text-accent">
                      #{tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        </AppleSpring>
      </div>
    </Section>
  );
}
