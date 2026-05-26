import type { Metadata } from "next";
import { getAllProjects } from "@/shared/data/queries";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { Recommender } from "@/features/projects/Recommender";
import { Section } from "@/shared/ui/Section";
import { AppleSpring } from "@/shared/ui/AppleSpring";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected and in-progress work by Dor Ben Tzur.",
};

export default async function ProjectsIndex() {
  const projects = await getAllProjects();
  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="All projects">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">Work</p>
          <h1 className="text-display font-bold tracking-tight mt-2">Projects</h1>
          <p className="text-body text-muted mt-3 max-w-2xl">
            Every project I&apos;ve shipped, ship-shaping now, or seriously prototyping.
            Manually curated — quality over quantity.
          </p>
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
