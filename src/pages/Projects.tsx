import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProjectsHero from "../components/projects/ProjectsHero";
import ProjectsFilters from "../components/projects/ProjectsFilters";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import ProjectsLoadMore from "../components/projects/ProjectsLoadMore";
import { projectFixtures } from "../data/projects";
import { listProjects } from "../services/projects";
import type { Project } from "../types/project";

const DEFAULT_VISIBLE_COUNT = 6;

// Allow exporting helpers alongside the page component for router data hooks.
// eslint-disable-next-line react-refresh/only-export-components
export async function projectsLoader() {
  try {
    const projects = await listProjects();
    if (projects.length) {
      return { projects };
    }
  } catch (error) {
    console.warn("[projectsLoader] Falling back to fixtures", error);
  }
  return { projects: projectFixtures };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjectsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const selectedTechnologies = searchParams.getAll("tech");

  const setQuery = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value.trim()) {
        next.set("q", value);
      } else {
        next.delete("q");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const toggleTechnology = useCallback(
    (tech: string) => {
      const next = new URLSearchParams(searchParams);
      const values = new Set(next.getAll("tech"));
      if (values.has(tech)) {
        values.delete(tech);
      } else {
        values.add(tech);
      }
      next.delete("tech");
      Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .forEach((value) => next.append("tech", value));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clear = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("tech");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    query,
    selectedTechnologies,
    setQuery,
    toggleTechnology,
    clear,
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(() => projectFixtures.map((project) => ({ ...project })));
  const [isLoading, setIsLoading] = useState(projectFixtures.length === 0);
  const { query, selectedTechnologies, setQuery, toggleTechnology, clear } =
    useProjectsSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { projects: initialProjects } = await projectsLoader();
        if (!cancelled) {
          setProjects(initialProjects.map((project) => ({ ...project })));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const technologies = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) => {
      const techList = (project.tech && project.tech.length ? project.tech : project.stack) ?? [];
      techList.forEach((tech) => set.add(tech));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const techFilters = selectedTechnologies;

    return projects.filter((project) => {
      const techList = (project.tech && project.tech.length ? project.tech : project.stack) ?? [];

      const matchesQuery = normalizedQuery
        ? [project.title, project.summary, ...techList]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      const matchesTech = techFilters.length
        ? techFilters.every((tech) => techList.includes(tech))
        : true;

      return matchesQuery && matchesTech;
    });
  }, [projects, query, selectedTechnologies]);

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [query, selectedTechnologies]);

  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, visibleCount),
    [filteredProjects, visibleCount]
  );

  const hasMore = filteredProjects.length > visibleCount;
  const hasActiveFilters = Boolean(query.trim().length || selectedTechnologies.length);

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <ProjectsHero
          totalProjects={projects.length}
          visibleProjects={visibleProjects.length}
          hasActiveFilters={hasActiveFilters}
        />

        <ProjectsFilters
          query={query}
          onQueryChange={setQuery}
          technologies={technologies}
          selectedTechnologies={selectedTechnologies}
          onToggleTechnology={toggleTechnology}
          onClear={clear}
        />

        <ProjectsGrid projects={visibleProjects} isLoading={isLoading} />

        <ProjectsLoadMore
          hasMore={hasMore}
          onLoadMore={() => setVisibleCount((count) => count + DEFAULT_VISIBLE_COUNT)}
        />
      </div>
    </div>
  );
}
