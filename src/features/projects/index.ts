/**
 * src/features/projects/index.ts
 *
 * Barrel exports for the projects feature. See docs/ARCHITECTURE.md for the
 * target folder layout. Implementations currently live at:
 *   - src/components/ProjectCard.tsx
 *   - src/components/Projects.tsx
 *   - src/components/projects/ProjectsCarousel.tsx
 *   - src/components/projects/ProjectsGrid.tsx
 *   - src/services/projects.ts
 *   - src/services/projectUrlImport.ts
 *   - src/data/project-fixtures.ts
 *   - src/types/project.ts
 *   - src/pages/admin/ProjectsAdmin.tsx
 */

export { default as ProjectCard } from '../../components/ProjectCard';
export { default as Projects } from '../../components/Projects';
export { default as ProjectsCarousel } from '../../components/projects/ProjectsCarousel';
export { default as ProjectsGrid } from '../../components/projects/ProjectsGrid';
export * from '../../services/projects';
export type { Project, ProjectStatus, ProjectMode, ProjectLink, ProjectMetric } from '../../types/project';
