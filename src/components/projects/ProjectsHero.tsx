import type { ReactNode } from "react";

type ProjectsHeroProps = {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  totalProjects: number;
  visibleProjects: number;
  hasActiveFilters: boolean;
};

const defaultTitle = "Projects";
const defaultDescription =
  "A curated collection of experiments, production launches, and technical deep dives.";

export default function ProjectsHero({
  eyebrow,
  title = defaultTitle,
  description = defaultDescription,
  totalProjects,
  visibleProjects,
  hasActiveFilters,
}: ProjectsHeroProps) {
  const visibleCopy = hasActiveFilters
    ? `${visibleProjects} of ${totalProjects} projects`
    : `${totalProjects} projects`;

  return (
    <header className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            {eyebrow}
          </span>
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">{description}</p>
        </div>
      </div>

      <dl className="flex flex-col items-start gap-1 text-sm text-white/70 md:items-end">
        <div>
          <dt className="sr-only">Visible projects</dt>
          <dd className="font-medium text-white">{visibleCopy}</dd>
        </div>
        {hasActiveFilters ? (
          <div>
            <dt className="sr-only">Filters active</dt>
            <dd>Filters applied</dd>
          </div>
        ) : (
          <div>
            <dt className="sr-only">Filters active</dt>
            <dd>All projects visible</dd>
          </div>
        )}
      </dl>
    </header>
  );
}