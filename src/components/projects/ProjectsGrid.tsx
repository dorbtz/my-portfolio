/**
 * src/components/projects/ProjectsGrid.tsx
 * Bento grid layout — P1 rewrite.
 *
 * Grid rules:
 *   - First featured project → 2×2 area (top-left).
 *   - Subsequent featured projects → 2×1 (wide).
 *   - Non-featured → 1×1.
 *   - At <960px, everything collapses to a single column stack.
 *
 * Keyboard navigation (arrow keys) is preserved from the original.
 * fuse.js search and tag-filter props are unchanged.
 */

import { useEffect, useRef } from 'react';
import ProjectCard from '../ProjectCard';
import type { Project } from '../../types/project';

type ProjectsGridProps = {
  projects: Project[];
  isLoading?: boolean;
  emptyMessage?: string;
};

/**
 * Determine the CSS grid span classes for a project card.
 * firstFeaturedIndex tracks which featured project was placed first so it
 * gets the 2×2 treatment; subsequent featured ones get 2×1.
 */
function gridAreaClass(
  project: Project,
  featuredCount: { value: number },
): string {
  if (!project.featured) return '';

  const n = featuredCount.value;
  featuredCount.value += 1;

  if (n === 0) {
    // First featured → 2 columns wide, 2 rows tall
    return 'bento-span-2x2';
  }
  // Other featured → 2 columns wide, 1 row tall
  return 'bento-span-2x1';
}

export default function ProjectsGrid({
  projects,
  isLoading = false,
  emptyMessage = 'No projects match the current filters. Try adjusting your search or reset the filters to see everything.',
}: ProjectsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Keyboard grid navigation (preserved from original)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    const handler = (event: KeyboardEvent) => {
      const cells = Array.from(el.querySelectorAll<HTMLElement>("[role='gridcell']"));
      if (!cells.length) return;
      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? cells.indexOf(active) : -1;
      // Approximate column count from computed grid
      const columns = Math.max(
        1,
        getComputedStyle(el).gridTemplateColumns.split(' ').length,
      );
      let nextIndex = currentIndex;
      switch (event.key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex < 0 ? 0 : currentIndex + 1, cells.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex < 0 ? 0 : currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex < 0 ? 0 : currentIndex + columns, cells.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex < 0 ? 0 : currentIndex - columns, 0);
          break;
        default:
          return;
      }
      event.preventDefault();
      cells[nextIndex]?.focus();
    };

    el.addEventListener('keydown', handler);
    return () => {
      el.removeEventListener('keydown', handler);
    };
  }, [projects.length]);

  if (isLoading) {
    return (
      <div
        ref={gridRef}
        className="bento-grid"
        aria-live="polite"
        aria-label="Loading projects"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
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

  // Track how many featured projects we've placed for span decision
  const featuredCount = { value: 0 };

  return (
    <div
      ref={gridRef}
      className="bento-grid"
      aria-live="polite"
    >
      {projects.map((project, index) => {
        const spanClass = gridAreaClass(project, featuredCount);
        return (
          <div key={project.id ?? project.title} className={`bento-cell ${spanClass}`}>
            <ProjectCard project={project} index={index} />
          </div>
        );
      })}
    </div>
  );
}
