import { useEffect, useMemo, useRef, useState } from "react";
import ProjectCard from "./ProjectCard";
import { PROJECTS_GRID_GAP, PROJECTS_GRID_SPACING, PROJECTS_SECTION_PADDING } from "./projectsTokens";
import { projectFixtures } from "../data/projects";
import { listProjects } from "../services/projects";
import type { Project } from "../types/project";
import Section from "./Section";
import Title from "./Title";

const FOCUS_AREAS = [
  "Product storytelling",
  "Realtime dashboards",
  "E-commerce experiences",
] as const;

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(() => projectFixtures.map((project) => ({ ...project })));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await listProjects();
        if (!cancelled && result.length) {
          setProjects(result);
        }
      } catch (error) {
        console.warn("[Projects] Using fixture data", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const haystack = [
        project.title,
        project.subtitle,
        project.summary,
        project.description,
        ...(project.stack ?? []),
        ...(project.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, query]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handler = (event: KeyboardEvent) => {
      const cells = Array.from(el.querySelectorAll<HTMLElement>("[role='gridcell']"));
      if (!cells.length) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? cells.findIndex((cell) => cell === active) : -1;
      const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length;
      let next = -1;
      switch (event.key) {
        case "ArrowRight":
          next = Math.min(idx < 0 ? 0 : idx + 1, cells.length - 1);
          break;
        case "ArrowLeft":
          next = Math.max(idx < 0 ? 0 : idx - 1, 0);
          break;
        case "ArrowDown":
          next = Math.min(idx < 0 ? 0 : idx + cols, cells.length - 1);
          break;
        case "ArrowUp":
          next = Math.max(idx < 0 ? 0 : idx - cols, 0);
          break;
        default:
          return;
      }
      event.preventDefault();
      cells[next]?.focus();
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  const visibleCount = filtered.length;
  const totalCount = projects.length;

  return (
    <Section id="projects" label="Projects" className={PROJECTS_SECTION_PADDING}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <Title className="reveal lg:flex-1 lg:min-w-0"
          eyebrow="Latest work"
          description="Case studies that pair cinematic UX with measurable outcomes. Data-backed, Thor-approved."
        >
          Apple-level craft, tailored to your product.
        </Title>

        <div className="glass-tile project-search-card w-full lg:self-end">
          <label
            className="block text-xs uppercase tracking-[0.28em]"
            htmlFor="project-search"
            style={{ color: "rgb(var(--color-muted) / 0.65)" }}
          >
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            placeholder='Try "dashboard", "Shopify", or "motion"'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="form-field mt-3 w-full bg-transparent"
          />
          <p className="mt-3 text-xs" style={{ color: "rgb(var(--color-muted) / 0.7)" }}>
            Showing {visibleCount} of {totalCount} experiences.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {FOCUS_AREAS.map((area) => (
          <span key={area} className="project-card__chip">
            {area}
          </span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="grid"
        className={`${PROJECTS_GRID_SPACING} grid grid-cols-1 ${PROJECTS_GRID_GAP} sm:grid-cols-2 xl:grid-cols-3`}
      >
        {filtered.length ? (
          filtered.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)
        ) : (
          <EmptyState />
        )}
      </div>
    </Section>
  );
}

function EmptyState() {
  return (
    <div
      role="gridcell"
      tabIndex={0}
      className="col-span-full glass-tile rounded-[28px] border border-white/12 p-10 text-center"
    >
      <p className="text-sm leading-6" style={{ color: "rgb(var(--color-muted) / 0.78)" }}>
        No projects match that search just yet. Try another keyword or reach out for a bespoke walkthrough.
      </p>
    </div>
  );
}


