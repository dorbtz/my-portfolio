import type { Project, ProjectLink } from "../types/project";
import ImageFallback from "./ImageFallback";
import { ProjectActionButton } from "./ProjectActionButton";
import { iconForProjectLink } from "./projectActionHelpers";

type Props = {
  project: Project;
  index: number;
};

function formatStatus(status?: Project["status"]) {
  if (!status) return "Draft";
  return status.replace("-", " ");
}

function uniqueList(items?: string[]) {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.filter(Boolean)));
}

function Summary({ text }: { text?: string | null }) {
  const content = text?.trim();
  return (
    <p
      className="text-sm leading-6"
      style={{
        color: "rgb(var(--color-muted) / 0.78)",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 4,
        overflow: "hidden",
        minHeight: "5.5rem",
      }}
    >
      {content || "No summary yet. The team is still brewing the story."}
    </p>
  );
}

export default function ProjectCard({ project, index }: Props) {
  const title = project.title?.trim() || "Untitled project";
  const slug = project.slug || project.id || `project-${index}`;
  const detailHref = slug ? `/projects/${slug}` : undefined;

  const summary = project.summary || project.description || "";
  const stack = uniqueList(project.stack).slice(0, 3);
  const tags = uniqueList(project.tags).slice(0, 4);
  const additionalLinks = (project.links ?? [])
    .filter((link): link is ProjectLink => Boolean(link?.url))
    .slice(0, 2);

  const statusLabel = formatStatus(project.status);

  return (
    <article
      role="gridcell"
      tabIndex={0}
      className="card project-card h-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg))]"
    >
      <div className="project-card__media">
        {detailHref ? (
          <a href={detailHref} aria-label={`${title} case study`} className="block">
            <ImageFallback
              src={project.coverUrl}
              alt={project.heroImageAlt || `${title} cover`}
              aspect="golden"
              rounded="rounded-none"
              className="h-full w-full"
            />
          </a>
        ) : (
          <ImageFallback
            src={project.coverUrl}
            alt={project.heroImageAlt || `${title} cover`}
            aspect="golden"
            rounded="rounded-none"
            className="h-full w-full"
          />
        )}

        <div className="project-card__pills">
          <span className="project-card__pill">{statusLabel}</span>
          {project.featured ? <span className="project-card__pill">Featured</span> : null}
          <span className="project-card__pill">Priority {project.priority ?? 0}</span>
        </div>
      </div>

      <div className="project-card__content">
        <div className="space-y-3">
          <div className="space-y-1.5">
            {detailHref ? (
              <a
                href={detailHref}
                className="text-lg font-semibold tracking-tight transition-colors duration-200"
                style={{ color: "rgb(var(--color-ink))" }}
                data-thor-hover
              >
                {title}
              </a>
            ) : (
              <h3
                className="text-lg font-semibold tracking-tight"
                style={{ color: "rgb(var(--color-ink))" }}
              >
                {title}
              </h3>
            )}
            {project.subtitle ? (
              <p className="text-sm font-medium" style={{ color: "rgb(var(--color-muted) / 0.72)" }}>
                {project.subtitle}
              </p>
            ) : null}
          </div>

          <Summary text={summary} />
        </div>

        {stack.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "rgb(var(--color-muted) / 0.65)" }}>
              Stack
            </p>
            <div className="project-card__stack">
              {stack.map((item) => (
                <span key={item} className="project-card__chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {tags.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
              Focus areas
            </p>
            <div className="project-card__tags">
              {tags.map((tag) => (
                <span key={tag} className="project-card__tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="project-card__footer">
          <div className="flex flex-wrap gap-2">
            {project.liveUrl ? (
              <ProjectActionButton href={project.liveUrl} label="Live site" icon="external" />
            ) : null}
            {project.repoUrl ? (
              <ProjectActionButton href={project.repoUrl} label="Source code" icon="github" />
            ) : null}
            {additionalLinks.map((link) => (
              <ProjectActionButton
                key={link.url}
                href={link.url}
                label={link.label}
                icon={iconForProjectLink(link)}
              />
            ))}
          </div>

          {detailHref ? (
            <a href={detailHref} className="project-card__cta" data-thor-hover>
              <span>View case study</span>
              <span aria-hidden="true">{'->'}</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

