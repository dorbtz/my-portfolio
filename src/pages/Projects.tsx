import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProjectsHero from "../components/projects/ProjectsHero";
import ProjectsFilters from "../components/projects/ProjectsFilters";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import ProjectsLoadMore from "../components/projects/ProjectsLoadMore";
import { filterProjectsByMode, getFixturesForMode } from "../data/project-fixtures";
import { listProjects } from "../services/projects";
import { useMode } from "../stores/mode";
// useAuth import removed (Round 38) — placeholder toggle is now public.
// import { useAuth } from "../hooks/useAuth.helpers";
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
  // Loader runs outside React, before mode is known — return Thor as a safe
  // default. The page component re-derives the visible list per active mode.
  return { projects: getFixturesForMode("thor") };
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
  const mode = useMode();
  // Raw rows from Supabase (or fixture fallback). Mode filtering happens
  // downstream so toggling Thor↔Luffy re-renders the visible list instantly.
  const [rawProjects, setRawProjects] = useState<Project[]>(() =>
    getFixturesForMode(mode).map((project) => ({ ...project })),
  );
  const [hasSupabaseData, setHasSupabaseData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // user / isAdmin removed (Round 38).
  // Round 75: admin-only toggle that mirrors the home Projects section.
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const { query, selectedTechnologies, setQuery, toggleTechnology, clear } =
    useProjectsSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listProjects();
        if (!cancelled && result.length) {
          setRawProjects(result);
          setHasSupabaseData(true);
        }
      } catch (error) {
        console.warn("[ProjectsPage] Falling back to fixtures", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-seed mode-aware fixtures whenever the user toggles modes — but only
  // when we don't have real Supabase rows (don't clobber actual portfolio data).
  useEffect(() => {
    if (!hasSupabaseData) {
      setRawProjects(getFixturesForMode(mode).map((p) => ({ ...p })));
    }
  }, [mode, hasSupabaseData]);

  // Round 76: strict placeholder visibility — placeholders are hidden by
  // default for everyone; admin opts in via the toggle.  No "fall back
  // to fixtures when DB empty" — empty DB renders empty grid (which is
  // exactly what visitors should see until real projects exist).
  const projects = useMemo(() => {
    const base = filterProjectsByMode(rawProjects, mode);
    const realOnly = base.filter((p) => p.placeholder !== true);
    // Round 38 — see Projects component: toggle is now visible to all.
    if (showPlaceholders) {
      const fixtureRows = getFixturesForMode(mode).map((p) => ({ ...p }));
      const seen = new Set(realOnly.flatMap((p) => [p.id, p.slug].filter(Boolean) as string[]));
      const extras = fixtureRows.filter((p) => !(p.id && seen.has(p.id)) && !(p.slug && seen.has(p.slug)));
      return [...realOnly, ...extras];
    }
    return realOnly;
  }, [rawProjects, mode, showPlaceholders]);

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

        <label className="projects-admin-toggle projects-admin-toggle--page">
          <input
            type="checkbox"
            checked={showPlaceholders}
            onChange={(e) => setShowPlaceholders(e.target.checked)}
          />
          <span>
            {mode === 'thor'
              ? '⚡ Summon Asgardian dossiers'
              : '☀ Hoist the Straw Hat archives'}
          </span>
        </label>

        <ProjectsGrid projects={visibleProjects} isLoading={isLoading} />

        <ProjectsLoadMore
          hasMore={hasMore}
          onLoadMore={() => setVisibleCount((count) => count + DEFAULT_VISIBLE_COUNT)}
        />
      </div>
    </div>
  );
}
