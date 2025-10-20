import type { Project } from "../types/project";
import ImageFallback from "./ImageFallback";

type Props = { project: Project; index: number; };

export default function ProjectCard({ project, index }: Props) {
  const id = (project.id ?? "").toString();
  const detailHref = id ? `/projects/${id}` : undefined;

  return (
    <article
      id={`project-${id || index}`}
      role="gridcell"
      tabIndex={0}
      data-index={index}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/2 dark:bg-white/1 shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] transition-transform duration-200 will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
    >
      {detailHref ? (
        <a href={detailHref} aria-label={`${project.title} case study`}>
          <ImageFallback
            src={project.cover_url}
            alt={`${project.title} cover`}
            className="transition-[transform] duration-300 group-hover:scale-[1.03]"
          />
        </a>
      ) : (
        <ImageFallback src={project.cover_url} alt={`${project.title} cover`} />
      )}

      <div className="p-4 md:p-5">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          {detailHref ? (
            <a href={detailHref} className="hover:opacity-90">{project.title}</a>
          ) : (
            project.title
          )}
        </h3>
        <p className="mt-2 text-sm/6 opacity-80">{project.summary}</p>
        {/* ...rest unchanged... */}
      </div>
    </article>
  );
}
