import { useMemo } from "react";

type ProjectsFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  technologies: string[];
  selectedTechnologies: string[];
  onToggleTechnology: (tech: string) => void;
  onClear: () => void;
};

export default function ProjectsFilters({
  query,
  onQueryChange,
  technologies,
  selectedTechnologies,
  onToggleTechnology,
  onClear,
}: ProjectsFiltersProps) {
  const hasFilters = query.trim().length > 0 || selectedTechnologies.length > 0;

  const tagButtons = useMemo(
    () =>
      technologies.map((tech) => {
        const active = selectedTechnologies.includes(tech);
        return (
          <button
            key={tech}
            type="button"
            onClick={() => onToggleTechnology(tech)}
            className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${
              active
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
            }`}
          >
            {tech}
          </button>
        );
      }),
    [technologies, selectedTechnologies, onToggleTechnology]
  );

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/2 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block w-full md:max-w-sm">
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by title, description, or tech"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-cyan-400/40"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-outline btn-sm"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {technologies.length ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by technology">
          {tagButtons}
        </div>
      ) : null}
    </section>
  );
}