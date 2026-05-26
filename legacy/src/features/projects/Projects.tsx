import { useEffect, useMemo, useState } from "react";
import { PROJECTS_SECTION_PADDING } from "./projectsTokens";
import { filterProjectsByMode, getFixturesForMode } from "./data/project-fixtures";
import { listProjects } from "./services/projects";
import { useMode } from "../../shared/stores/mode";
import type { Project } from "../../types/project";
import Section from "../../shared/ui/Section";
import ProjectsCarousel from "./carousel/ProjectsCarousel";
import { useSiteContent } from "../content/hooks/useSiteContent";
// useAuth import removed (Round 38) — placeholder toggle is no longer
// admin-gated; everyone can flip it.
// import { useAuth } from "../hooks/useAuth.helpers";

// Mode-aware focus chips. Thor → Asgardian realms. Luffy → Straw Hat crew roles.
// Round 13: now CMS-driven via useSiteContent('projects').focusAreas; these
// constants remain as the synchronous fallback layer for first paint.
const FOCUS_AREAS_BY_MODE = {
  thor: ['Asgard', 'Bifrost ops', 'Mjolnir-grade UI'] as const,
  gear5: ['Captain & crew', 'Grand Line voyages', 'Wanted bounties'] as const,
};

export default function Projects() {
  const mode = useMode();
  const copy = useSiteContent('projects');
  // user / isAdmin removed (Round 38) — see import comment above.
  // Raw rows — either Supabase results or mode-aware fixtures. The visible
  // list is derived per-render via filterProjectsByMode so toggling modes
  // immediately re-filters without a refetch.
  const [rawProjects, setRawProjects] = useState<Project[]>(() =>
    getFixturesForMode(mode).map((project) => ({ ...project }))
  );
  const [hasSupabaseData, setHasSupabaseData] = useState(false);
  // Round 75: admin-only toggle to also surface placeholder fixtures
  // alongside real Supabase rows.  Default false — once admin has real
  // data, placeholders are hidden by default.
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  // Re-seed fixtures whenever the mode changes, but only if we don't have
  // real Supabase data yet (don't clobber actual portfolio rows).
  useEffect(() => {
    if (!hasSupabaseData) {
      setRawProjects(getFixturesForMode(mode).map((p) => ({ ...p })));
    }
  }, [mode, hasSupabaseData]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await listProjects();
        if (!cancelled && result.length) {
          setRawProjects(result);
          setHasSupabaseData(true);
        }
      } catch (error) {
        console.warn("[Projects] Using fixture data", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mode-filtered projects.
  // Round 76 — strict placeholder visibility per user feedback:
  //   - Placeholders (every fixture row carries `placeholder: true`) are
  //     ALWAYS hidden from public visitors and from admins by default.
  //   - Admins can flip the "Include placeholder examples" toggle to mix
  //     them back in (useful for previewing the layout before real rows
  //     are loaded).  No automatic "fall back to fixtures when DB empty"
  //     behaviour any more — empty DB → empty section, exactly as
  //     visitors will see post-launch.
  const projects = useMemo(() => {
    const base = filterProjectsByMode(rawProjects, mode);
    const realOnly = base.filter((p) => p.placeholder !== true);
    // Round 38 — placeholder toggle is now visible to everyone (not just
    // admins) since the placeholder JSON ships with the repo. Anyone who
    // ticks the box gets to see the demo bounties / dossiers.
    if (showPlaceholders) {
      const fixtureRows = getFixturesForMode(mode).map((p) => ({ ...p }));
      const seen = new Set(realOnly.flatMap((p) => [p.id, p.slug].filter(Boolean) as string[]));
      const extras = fixtureRows.filter((p) => !(p.id && seen.has(p.id)) && !(p.slug && seen.has(p.slug)));
      return [...realOnly, ...extras];
    }
    return realOnly;
  }, [rawProjects, mode, showPlaceholders]);

  // Prefer CMS focus areas (string[]) when available; otherwise the static
  // constant. Empty array is treated as missing (admin probably mid-edit).
  const FOCUS_AREAS = useMemo<readonly string[]>(() => {
    const fromCms = Array.isArray(copy.focusAreas)
      ? (copy.focusAreas as string[]).filter((s) => typeof s === 'string')
      : null;
    if (fromCms && fromCms.length) return fromCms;
    return FOCUS_AREAS_BY_MODE[mode];
  }, [copy.focusAreas, mode]);
  const searchPlaceholder = typeof copy.searchPlaceholder === 'string' && copy.searchPlaceholder.length
    ? copy.searchPlaceholder
    : (mode === 'thor'
        ? 'Search the realms — Mjolnir, Bifrost, Asgard…'
        : 'Search the crew — Luffy, Zoro, bounty…');
  const emptyState = typeof copy.emptyState === 'string' && copy.emptyState.length
    ? copy.emptyState
    : 'No projects match that search just yet. Try another keyword or reach out for a bespoke walkthrough.';

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const haystack = [
        project.title,
        project.subtitle,
        project.summary,
        project.description,
        ...(project.stack ?? []),
        ...(project.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, query]);

  const visibleCount = filtered.length;
  const totalCount = projects.length;

  return (
    <Section id="projects" label="Projects" className={PROJECTS_SECTION_PADDING}>
      {/* P3: visible section heading removed — the project cards are the statement.
           sr-only h2 preserves document outline and accessibility. */}
      <h2 className="sr-only">Selected Projects</h2>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Thin manga-styled search bar */}
        <div className="projects-search w-full lg:max-w-md">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <span className="projects-search__icon" aria-hidden="true">⌕</span>
          <input
            id="project-search"
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="projects-search__input"
          />
          <span className="projects-search__count" aria-live="polite">
            {visibleCount}/{totalCount}
          </span>
        </div>

        {/* Mode-aware focus chips — slim manga / asgardian style */}
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <span key={area} className="projects-chip">
              {area}
            </span>
          ))}
        </div>

        {/* Round 38 — public placeholder toggle.  Visible to everyone
            (not gated on admin) and the label is mode-aware. */}
        <label className="projects-admin-toggle">
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
      </div>

      {filtered.length ? (
        <ProjectsCarousel projects={filtered} />
      ) : (
        <EmptyState message={emptyState} />
      )}
    </Section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="glass-tile mt-8 rounded-[28px] border border-white/12 p-10 text-center"
    >
      <p className="text-sm leading-6" style={{ color: "rgb(var(--color-muted) / 0.78)" }}>
        {message}
      </p>
    </div>
  );
}


