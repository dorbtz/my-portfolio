import { useEffect, useRef } from "react";
import ProjectCard from "../ProjectCard";
import type { Project } from "../../types/project";

type ProjectsGridProps = {
  projects: Project[];
  isLoading?: boolean;
  emptyMessage?: string;
};

export default function ProjectsGrid({
  projects,
  isLoading = false,
  emptyMessage = "No projects match the current filters. Try adjusting your search or reset the filters to see everything.",
}: ProjectsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    const handler = (event: KeyboardEvent) => {
      const cells = Array.from(el.querySelectorAll<HTMLElement>("[role='gridcell']"));
      if (!cells.length) return;
      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? cells.indexOf(active) : -1;
      const columns = Math.max(1, getComputedStyle(el).gridTemplateColumns.split(" ").length);
      let nextIndex = currentIndex;
      switch (event.key) {
        case "ArrowRight":
          nextIndex = Math.min((currentIndex < 0 ? 0 : currentIndex + 1), cells.length - 1);
          break;
        case "ArrowLeft":
          nextIndex = Math.max((currentIndex < 0 ? 0 : currentIndex - 1), 0);
          break;
        case "ArrowDown":
          nextIndex = Math.min((currentIndex < 0 ? 0 : currentIndex + columns), cells.length - 1);
          break;
        case "ArrowUp":
          nextIndex = Math.max((currentIndex < 0 ? 0 : currentIndex - columns), 0);
          break;
        default:
          return;
      }
      event.preventDefault();
      cells[nextIndex]?.focus();
    };

    el.addEventListener("keydown", handler);
    return () => {
      el.removeEventListener("keydown", handler);
    };
  }, [projects.length]);

  if (isLoading) {
    return (
      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div
        ref={gridRef}
        className="grid grid-cols-1"
        role="status"
        aria-live="polite"
      >
        <div className="rounded-2xl border border-white/10 bg-white/2 p-8 text-center text-sm text-white/70">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-live="polite"
    >
      {projects.map((project, index) => (
        <ProjectCard key={project.id ?? project.title} project={project} index={index} />
      ))}
    </div>
  );
}