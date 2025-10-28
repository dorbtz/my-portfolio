import { useEffect, useMemo, useRef, useState } from "react";
import ProjectCard from "./ProjectCard";
import {
  PROJECTS_GRID_GAP,
  PROJECTS_GRID_PADDING,
  PROJECTS_GRID_SPACING,
  PROJECTS_HEADING_MARGIN,
  PROJECTS_SECTION_PADDING,
} from "./projectsTokens";
import { listProjects } from "../services/projects";
import type { Project } from "../types/project";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await listProjects();
      if (!cancelled) setProjects(result);
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
    return projects.filter((p) => {
      const hay = [p.title, p.summary, ...(p.tech || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [projects, query]);

  // keyboard navigation (unchanged)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      const cells = Array.from(el.querySelectorAll<HTMLElement>("[role='gridcell']"));
      if (!cells.length) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? cells.findIndex((c) => c === active) : -1;
      const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length;
      let next = -1;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min((idx < 0 ? 0 : idx + 1), cells.length - 1);
          break;
        case "ArrowLeft":
          next = Math.max((idx < 0 ? 0 : idx - 1), 0);
          break;
        case "ArrowDown":
          next = Math.min((idx < 0 ? 0 : idx + cols), cells.length - 1);
          break;
        case "ArrowUp":
          next = Math.max((idx < 0 ? 0 : idx - cols), 0);
          break;
        default:
          return;
      }
      e.preventDefault();
      cells[next]?.focus();
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  return (
    <section id="projects" className={PROJECTS_SECTION_PADDING}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              className={`${PROJECTS_HEADING_MARGIN} text-2xl font-semibold tracking-tight md:text-3xl`}
            >
              Projects
            </h2>
            <p className="mt-1 text-sm/6 opacity-80">
              Powered by Supabase (with local fallback).
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search projects</span>
            <input
              type="search"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-72 rounded-xl border border-white/10 bg-white/2 px-3 py-2 text-sm/6 outline-none focus:border-white/20 focus:ring-2 focus:ring-cyan-400/40"
            />
          </label>
        </header>

        <div
          ref={gridRef}
          role="grid"
          className={`${PROJECTS_GRID_SPACING} grid grid-cols-1 ${PROJECTS_GRID_GAP} ${PROJECTS_GRID_PADDING} sm:grid-cols-2 lg:grid-cols-3`}
        >
          {filtered.length ? (
            filtered.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      role="gridcell"
      tabIndex={0}
      className="col-span-full rounded-2xl border border-white/10 p-8 text-center"
    >
      <p className="text-sm/6 opacity-80">
        No projects found. If offline or missing keys, using local data.
      </p>
    </div>
  );
}
