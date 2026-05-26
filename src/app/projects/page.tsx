import type { Metadata } from "next";
import { getAllProjects } from "@/shared/data/queries";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { Recommender } from "@/features/projects/Recommender";
import { Section } from "@/shared/ui/Section";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected and in-progress work by Dor Ben Tzur.",
};

const EYEBROW = "Work";
const TITLE = "Projects";
const BODY =
  "Every project I've shipped, ship-shaping now, or seriously prototyping. Manually curated — quality over quantity.";

export default async function ProjectsIndex() {
  const [{ locale }, projects] = await Promise.all([readThemeState(), getAllProjects()]);
  const t = await localize(locale, [
    { en: EYEBROW, contentType: "projects-index.eyebrow" },
    { en: TITLE, contentType: "projects-index.title" },
    { en: BODY, contentType: "projects-index.body" },
  ]);
  return (
    <main id="main-content" className="min-h-dvh">
      <Section padding={9} ariaLabel="All projects">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(EYEBROW)}</p>
          <h1 className="text-display font-bold tracking-tight mt-2">{t(TITLE)}</h1>
          <p className="text-body text-muted mt-3 max-w-2xl">{t(BODY)}</p>
        </AppleSpring>
        <AppleSpring kind="fade-up" delay={120}>
          <div className="mt-8">
            <Recommender />
          </div>
        </AppleSpring>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {projects.map((p, i) => (
            <AppleSpring key={p.slug} kind="fade-up" delay={80 + i * 60}>
              <ProjectCard project={p} />
            </AppleSpring>
          ))}
        </div>
      </Section>
    </main>
  );
}
