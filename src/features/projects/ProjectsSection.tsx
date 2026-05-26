import Link from "next/link";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { getFeaturedProjects } from "@/shared/data/queries";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";
import { ProjectCard } from "./ProjectCard";

const PS_EYEBROW = "Work";
const PS_TITLE = "Selected projects.";
const PS_BODY_PREFIX = "A curated slice of what I've been shipping. The full index lives at";

export async function ProjectsSection() {
  const [{ locale }, projects] = await Promise.all([readThemeState(), getFeaturedProjects(6)]);
  const t = await localize(locale, [
    { en: PS_EYEBROW, contentType: "projects-section.eyebrow" },
    { en: PS_TITLE, contentType: "projects-section.title" },
    { en: PS_BODY_PREFIX, contentType: "projects-section.body" },
  ]);
  return (
    <Section id="projects" ariaLabel="Selected projects">
      <AppleSpring kind="fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(PS_EYEBROW)}</p>
            <h2 className="text-h1 font-bold mt-2">{t(PS_TITLE)}</h2>
            <p className="text-body text-muted mt-3 max-w-2xl">
              {t(PS_BODY_PREFIX)}{" "}
              <Link href="/projects" className="text-accent underline underline-offset-4">
                /projects
              </Link>
              .
            </p>
          </div>
        </div>
      </AppleSpring>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {projects.map((p, i) => (
          <AppleSpring key={p.slug} kind="fade-up" delay={80 + i * 60}>
            <ProjectCard project={p} />
          </AppleSpring>
        ))}
      </div>
    </Section>
  );
}
