import Link from "next/link";
import type { Project } from "@/types/project";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";

const STATUS_LABEL: Record<Project["status"], string> = {
  shipped: "Shipped",
  "in-progress": "In progress",
  draft: "Concept",
  archived: "Archived",
};

export function ProjectDetail({ project }: { project: Project }) {
  return (
    <Section padding={9} ariaLabel={project.title}>
      <AppleSpring kind="fade-up" trigger="mount">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-body-sm text-muted hover:text-accent transition-colors"
        >
          <span aria-hidden>←</span> All projects
        </Link>

        <div className="mt-6">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">
            {STATUS_LABEL[project.status]}
          </p>
          <h1 className="text-display font-bold tracking-tight mt-2">{project.title}</h1>
          <p className="text-h2 text-muted mt-3 max-w-3xl">{project.tagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer noopener">
              <GlassButton variant="primary">Visit live →</GlassButton>
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer noopener">
              <GlassButton variant="ghost">Source on GitHub</GlassButton>
            </a>
          )}
        </div>
      </AppleSpring>

      <div className="grid gap-6 lg:grid-cols-3 mt-10">
        <AppleSpring kind="fade-up" delay={120} className="lg:col-span-2">
          <GlassCard padding={7}>
            {project.problem && (
              <div>
                <h2 className="text-h3 font-semibold">The problem</h2>
                <p className="text-body text-muted mt-2">{project.problem}</p>
              </div>
            )}
            {project.role && (
              <div className="mt-6">
                <h2 className="text-h3 font-semibold">My role</h2>
                <p className="text-body text-muted mt-2">{project.role}</p>
              </div>
            )}
            {project.writeup && (
              <div className="mt-6">
                <h2 className="text-h3 font-semibold">What it does</h2>
                <p className="text-body text-muted mt-2 whitespace-pre-wrap">
                  {project.writeup}
                </p>
              </div>
            )}
          </GlassCard>
        </AppleSpring>

        <AppleSpring kind="fade-up" delay={180}>
          <GlassCard padding={5} className="h-full">
            {project.stack.length > 0 && (
              <>
                <p className="text-caption uppercase tracking-wider text-muted">Stack</p>
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
                <p className="text-caption uppercase tracking-wider text-muted">Tags</p>
                <ul className="flex flex-wrap gap-2 mt-3">
                  {project.tags.map((t) => (
                    <li key={t} className="text-caption text-accent">
                      #{t}
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
