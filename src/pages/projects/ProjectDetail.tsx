import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProject } from "../../services/projects";
import type { Project } from "../../types/project";
import { setPageMeta } from "../../lib/seo";
import ImageFallback from "../../components/ImageFallback";
import { useGithubBadge } from "../../hooks/useGithubBadge";

export default function ProjectDetail() {
  const { id: pid } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Always call hooks, never after early returns
  const { count: ghCount, label: ghLabel } = useGithubBadge(project?.repo_url);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const p = pid ? await getProject(pid) : null;
      if (!cancel) {
        setProject(p);
        setLoading(false);
        if (p) {
          setPageMeta({
            title: `${p.title} — Case Study`,
            description: p.summary,
            image: p.cover_url,
            url: `${window.location.origin}/projects/${pid}`,
          });
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pid]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 text-sm opacity-80">
        Loading…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-2 opacity-80">This case study doesn’t exist.</p>
        <Link
          to="/#projects"
          className="mt-4 inline-block rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <article
      className="mx-auto max-w-6xl px-4 md:px-6"
      style={{ paddingTop: "calc(var(--hdr-h,72px) + 16px)", paddingBottom: "56px" }}
    >
      {/* Breadcrumb + thin divider */}
      <div className="mb-3 reveal">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100"
        >
          ← Back to Projects
        </Link>
      </div>
      <hr className="hr-soft mb-4 reveal reveal-delay-1" />

      {/* Compact hero: Title only */}
      <header className="grid gap-4 md:grid-cols-12 md:items-start">
        <div className="md:col-span-7 md:pr-6">
          <div className="content-safe mx-auto md:mx-0">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight reveal">
              {project.title}
            </h1>
          </div>
        </div>

        {/* Right rail — sticky */}
        <aside className="md:col-span-5">
          <div className="md:sticky md:top-[calc(var(--hdr-h,72px)+16px)] space-y-4">
            {/* Visual */}
            <div className="card reveal">
              <ImageFallback
                src={project.cover_url}
                alt={`${project.title} cover`}
                rounded="rounded-2xl"
                aspect="golden"
              />
            </div>

            {/* Quick info */}
            <div className="card reveal reveal-delay-1 text-sm">
              <h4 className="text-sm font-semibold mb-3 opacity-90">Quick info</h4>

              {/* Tagline from summary (single-line, tooltip for full) */}
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Tagline</div>
                <p className="truncate opacity-90" title={project.summary || ""}>
                  {project.summary || "—"}
                </p>
              </div>

              {/* Stack chips */}
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Stack</div>
                {project.tech?.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] opacity-90"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="opacity-60 text-xs">—</div>
                )}
              </div>

              {/* Actions: icon-only & symmetric; GitHub badge optional */}
              <div className="flex items-center gap-2">
                <a
                  aria-label="Live demo"
                  href={project.live_url || "#"}
                  onClick={(e) => {
                    if (!project.live_url) e.preventDefault();
                  }}
                  target={project.live_url ? "_blank" : undefined}
                  rel={project.live_url ? "noreferrer" : undefined}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${
                    project.live_url
                      ? "border-white/10 hover:bg-white/5"
                      : "border-white/8 opacity-50 cursor-not-allowed"
                  }`}
                  title={project.live_url ? "Open live demo" : "Live URL not provided"}
                >
                  {/* External link arrow */}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                    />
                  </svg>
                </a>

                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub repository"
                  title="GitHub repository"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 hover:bg-white/5"
                >
                  {/* GitHub mark */}
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.33 6.85 9.68c.5.09.68-.22.68-.49c0-.24-.01-.86-.01-1.69c-2.78.62-3.37-1.36-3.37-1.36c-.46-1.19-1.12-1.5-1.12-1.5c-.91-.64.07-.63.07-.63c1.01.07 1.54 1.06 1.54 1.06c.9 1.58 2.36 1.12 2.94.86c.09-.67.35-1.12.63-1.38c-2.22-.26-4.56-1.14-4.56-5.09c0-1.12.39-2.03 1.03-2.75c-.1-.26-.45-1.32.1-2.75c0 0 .85-.28 2.79 1.05c.81-.23 1.68-.35 2.55-.35c.86 0 1.74.12 2.55.35c1.94-1.33 2.79-1.05 2.79-1.05c.55 1.43.2 2.49.1 2.75c.64.72 1.03 1.63 1.03 2.75c0 3.96-2.34 4.82-4.57 5.08c.36.32.68.95.68 1.92c0 1.39-.01 2.51-.01 2.85c0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
                    />
                  </svg>
                </a>

                {ghCount !== null && ghLabel ? (
                  <span
                    className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs opacity-90"
                    title={`GitHub ${ghLabel.toLowerCase()}`}
                  >
                    {ghLabel}: <strong className="tabular-nums">{ghCount}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            {/* On this page (mini TOC) */}
            <nav className="card reveal reveal-delay-2 text-sm">
              <h4 className="text-sm font-semibold mb-2 opacity-90">On this page</h4>
              <ul className="space-y-1">
                <li><a className="hover:opacity-100 opacity-85" href="#overview">Overview</a></li>
                <li><a className="hover:opacity-100 opacity-85" href="#highlights">Highlights</a></li>
                <li><a className="hover:opacity-100 opacity-85" href="#architecture">Architecture</a></li>
                <li><a className="hover:opacity-100 opacity-85" href="#outcomes">Outcomes</a></li>
              </ul>
            </nav>
          </div>
        </aside>
      </header>

      {/* Left column: cards with clear spacing */}
      <section className="mt-6 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7 md:pr-6">
          <div className="content-safe mx-auto md:mx-0 space-y-10">
            <div id="overview" className="card reveal">
              <h2 className="section-head">Overview</h2>
              <p className="mt-2">
                Context, goals, and your high-level approach. Summarize the problem and what makes this solution distinct
                (performance, UX, architecture).
              </p>
            </div>

            <div id="highlights" className="card reveal reveal-delay-1">
              <h2 className="section-head">Highlights</h2>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>Performance: 60 fps interactions, no layout shift.</li>
                <li>Accessibility: keyboard workflows, ARIA, reduced-motion support.</li>
                <li>Engineering: typed state, modular design, clean data boundaries.</li>
              </ul>
            </div>

            <div id="architecture" className="card reveal reveal-delay-2">
              <h2 className="section-head">Architecture</h2>
              <p className="mt-2">
                React + Vite + TypeScript + Tailwind v4. Data via Supabase (public reads), admin CRUD protected by RLS.
                Media served from Supabase Storage with public read and authenticated writes.
              </p>
            </div>

            <div id="outcomes" className="card reveal reveal-delay-3">
              <h2 className="section-head">Outcomes</h2>
              <p className="mt-2">Show measurable results. Examples:</p>
              <ul className="mt-3 list-inside list-disc space-y-1">
                <li><strong>First load:</strong> ~1.2s on mid-range mobile</li>
                <li><strong>TTI:</strong> ~0.8s</li>
                <li><strong>Bundle size:</strong> −30%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Spacer column to keep slight left bias vs. right rail */}
        <div className="md:col-span-5" />
      </section>
    </article>
  );
}
