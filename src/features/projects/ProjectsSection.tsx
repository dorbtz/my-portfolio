import Link from "next/link";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { getFeaturedProjects } from "@/shared/data/queries";
import { ProjectCard } from "./ProjectCard";

export async function ProjectsSection() {
  const projects = await getFeaturedProjects(6);
  return (
    <Section id="projects" ariaLabel="Selected projects">
      <AppleSpring kind="fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-caption uppercase tracking-[0.18em] text-accent">Work</p>
            <h2 className="text-h1 font-bold mt-2">Selected projects.</h2>
            <p className="text-body text-muted mt-3 max-w-2xl">
              A curated slice of what I&apos;ve been shipping. The full index lives at{" "}
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
