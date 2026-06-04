import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types/project";
import { GlassCard } from "@/shared/ui/GlassCard";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";
import { localize } from "@/shared/lib/i18n/localize";

/** Permanent fallback cover for projects without their own image
 *  (e.g. "coming soon" placeholders). Lives in /public. */
const PLACEHOLDER_COVER = "/coming_soon.png";

export async function ProjectCard({ project }: { project: Project }) {
  const { locale } = await readThemeState();
  const t = getChromeStrings(locale);
  // Translate the tagline so the card text matches the rest of the page.
  // Cached per project slug — same lookup as the project detail page so
  // we only ever generate the HE translation for the tagline once.
  const tr = await localize(locale, [
    { en: project.tagline, contentType: `project:${project.slug}.tagline` },
  ]);
  const isStub = project.status === "draft";

  return (
    <Link
      href={`/projects/${project.slug}`}
      aria-label={`${project.title} — ${project.tagline}`}
      className="group block h-full focus-visible:outline-none rounded-lg"
    >
      <GlassCard
        padding={6}
        className="project-card h-full flex flex-col overflow-hidden transition-transform duration-snap ease-snap group-hover:-translate-y-0.5 relative"
      >
        {/* Cover image — every card shows one so all cards share the same
            shape/height. Falls back to the permanent "coming soon" placeholder
            when the project has no cover yet. Bleeds to the card edges
            (cancels GlassCard's p-6/sm:p-7). */}
        <div className="-mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-5 relative aspect-[16/9] overflow-hidden bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]">
          <Image
            src={project.coverUrl || PLACEHOLDER_COVER}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-snap ease-snap group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption uppercase tracking-wider text-accent">
            {t.status[project.status]}
          </p>
          {project.tags.length > 0 && (
            <span className="text-caption text-muted">
              {project.tags.slice(0, 2).join(" · ")}
            </span>
          )}
        </div>
        <h3 className="text-h2 font-semibold mt-2">{project.title}</h3>
        <p className="text-body text-muted mt-2 line-clamp-3">{tr(project.tagline)}</p>
        {!isStub && project.stack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-4">
            {project.stack.slice(0, 5).map((s) => (
              <li
                key={s}
                className="px-2 py-1 rounded-pill text-caption border border-line bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] text-muted"
              >
                {s}
              </li>
            ))}
            {project.stack.length > 5 && (
              <li className="px-2 py-1 rounded-pill text-caption text-muted">
                +{project.stack.length - 5}
              </li>
            )}
          </ul>
        )}
      </GlassCard>
    </Link>
  );
}
