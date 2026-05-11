/**
 * src/components/ProjectCard.tsx
 * Mode-specific project card — P3 rewrite.
 *
 * Luffy (Gear 5) mode:
 *   Front  → aged wanted-poster (unchanged from P1).
 *   Back   → One Piece-themed StrawHat back (NEW: parchment + wave pattern +
 *             Straw Hat Gazette chyron + pirate-stamp CTA).
 *
 * Thor mode:
 *   Front  → Asgardian tech card (NEW: dark navy + starfield + gold frame).
 *   Back   → Asgardian cinematic back (unchanged from P1).
 *
 * Consumers unchanged — same Props interface (project, index).
 */

import { useCallback, useState } from 'react';
import type { Project, ProjectLink } from '../../types/project';
import ImageFallback from '../../shared/ui/ImageFallback';
import { ProjectActionButton } from './ProjectActionButton';
import { iconForProjectLink } from './projectActionHelpers';
import { useMode } from '../../shared/stores/mode';
import { useViewTransitionNav } from '../../shared/lib/navigate';
import { resolveProjectCover } from './lib/projectDefaultCover';
import {
  AVENGER_BY_PROJECT,
  type AvengerPlaceholder,
} from './data/projectCharacters';

type Props = {
  project: Project;
  index: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * CharacterOverlay renders the per-project Avenger art (Thor mode only).
 *
 * NOTE (May 2026): the Gear 5 / Luffy branch was removed because the wanted
 * poster IS the character — stamping a second name badge on the image was
 * confusing and pulled the wrong asset for the captain. The Asgardian card
 * keeps its small Avenger glyph in the bottom-right of the cover.
 */
function CharacterOverlay({ slug }: { slug: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  const avenger: AvengerPlaceholder | undefined = AVENGER_BY_PROJECT[slug];
  if (!avenger) return null;

  const showImage = !imgFailed && Boolean(avenger.src);

  return (
    <div className="character-overlay" aria-label={avenger.alt}>
      {showImage ? (
        <img
          src={avenger.src}
          alt={avenger.alt}
          className="character-overlay__img"
          onError={() => setImgFailed(true)}
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="character-overlay__badge" aria-hidden="true">
          {avenger.name}
        </span>
      )}
    </div>
  );
}

function statusLabel(status?: Project['status']): string {
  switch (status) {
    case 'shipped': return 'SHIPPED';
    case 'in-progress': return 'IN PROGRESS';
    case 'archived': return 'ARCHIVED';
    default: return 'DRAFT';
  }
}

function runicStatusLabel(status?: Project['status']): string {
  switch (status) {
    case 'shipped': return '⚡ SHIPPED ᚱ';
    case 'in-progress': return '⚡ IN PROGRESS ᚠ';
    case 'archived': return '⚡ ARCHIVED ᚦ';
    default: return '⚡ DRAFT ᚢ';
  }
}

function statusColor(status?: Project['status']): string {
  switch (status) {
    case 'shipped': return '#22c55e';
    case 'in-progress': return '#f59e0b';
    case 'archived': return '#94a3b8';
    default: return '#e2e8f0';
  }
}

// ---------------------------------------------------------------------------
// Round 34 — Captain byline
// Renders the owner identity (avatar + name + handle + email) on the front
// of every project card, respecting the per-owner visibility flags from
// public.profiles. Returns null when the owner has hidden every field.
// ---------------------------------------------------------------------------
function CaptainByline({ project, variant }: { project: Project; variant: 'luffy' | 'thor' }) {
  const showName     = project.ownerShowName     ?? true;
  const showUsername = project.ownerShowUsername ?? true;
  const showEmail    = project.ownerShowEmail    ?? false;
  const showAvatar   = project.ownerShowAvatar   ?? true;

  const name     = showName     ? (project.ownerDisplayName?.trim() || '')   : '';
  const username = showUsername ? (project.ownerUsername?.trim() || '')      : '';
  const email    = showEmail    ? (project.ownerEmail?.trim() || '')         : '';
  const avatar   = showAvatar   ? (project.ownerAvatarUrl?.trim() || '')     : '';

  if (!name && !username && !email && !avatar) return null;

  const initials = (() => {
    const src = name || username || email;
    if (!src) return '⚓';
    const parts = src.split(/[\s@_-]+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || src[0].toUpperCase();
  })();

  return (
    <div
      className={`captain-byline captain-byline--${variant}`}
      aria-label="Project author"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '.5rem',
        fontSize: '.7rem',
        marginTop: '.4rem',
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.5px solid currentColor',
            flex: '0 0 26px',
          }}
        />
      ) : showAvatar ? (
        <span
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: '.62rem',
            fontWeight: 800,
            background: variant === 'thor' ? '#142a4a' : '#ffd766',
            color: variant === 'thor' ? '#76cfff' : '#1a0d05',
            border: '1.5px solid currentColor',
            flex: '0 0 26px',
          }}
        >
          {initials}
        </span>
      ) : null}
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        {name && (
          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
        )}
        {(username || email) && (
          <div style={{ opacity: 0.7, fontSize: '.62rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {username && <>@{username}</>}
            {username && email && ' · '}
            {email}
          </div>
        )}
      </div>
    </div>
  );
}

function getBountyLine(project: Project): string {
  if (project.metrics && project.metrics.length > 0) {
    const first = project.metrics[0];
    if (first.value) {
      return `BOUNTY: ${first.value} ⭐`;
    }
  }
  return 'BOUNTY: ???';
}

function uniqueList(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.filter(Boolean)));
}

function filterLinks(links?: ProjectLink[] | null): ProjectLink[] {
  if (!Array.isArray(links)) return [];
  return links.filter((l): l is ProjectLink => Boolean(l?.label && l?.url));
}

// ---------------------------------------------------------------------------
// Luffy mode — front: existing wanted poster (unchanged)
// ---------------------------------------------------------------------------
function WantedFrontCard({
  project,
  title,
  bounty,
  tags,
  coverUrl,
}: {
  project: Project;
  title: string;
  bounty: string;
  tags: string[];
  coverUrl: string | undefined;
}) {
  return (
    <div className="wanted-card__front" data-testid="wanted-front">
      {/* Corner stamp — Gear 5 Wano sun mark */}
      <span className="wanted-card__corner-stamp" aria-hidden="true">☀</span>

      {/* WANTED header band */}
      <header className="wanted-card__header">
        <span className="wanted-card__wanted-text">WANTED</span>
        <span className="wanted-card__kanji" aria-label="Dead or alive">生死不問</span>
        <span
          className="wanted-card__status"
          style={{ color: statusColor(project.status) }}
        >
          {statusLabel(project.status)}
        </span>
      </header>

      {/* Cover image — pure poster PNG (May 2026: removed name-badge overlay
          per user request; the character name lives in the WANTED banner
          header above and the nameplate below, never stamped on the photo).
          The `slug` prop is intentionally retained on this branch for keyboard
          navigation / view-transition hooks; it is no longer used to look up
          a CharacterOverlay because the per-poster Luffy override caused the
          captain's poster to show the LuffyImageRain alt image instead of
          /assets/One-Piece/wanted/Luffy.png. */}
      <div
        className="wanted-card__photo"
        style={
          project.id
            ? ({ viewTransitionName: `project-cover-${project.id}` } as React.CSSProperties)
            : undefined
        }
      >
        <ImageFallback
          src={coverUrl}
          alt={project.heroImageAlt || `${title} cover`}
          aspect="golden"
          rounded="rounded-none"
          className="wanted-card__img"
        />
        <span className="wanted-card__vignette" aria-hidden="true" />
      </div>

      {/* Nameplate */}
      <div className="wanted-card__nameplate">
        <h3 className="wanted-card__title">{title}</h3>
        {project.subtitle ? (
          <p className="wanted-card__subtitle">{project.subtitle}</p>
        ) : null}
        <CaptainByline project={project} variant="luffy" />
      </div>

      {/* Bounty line */}
      <p className="wanted-card__bounty">{bounty}</p>

      {/* Tags */}
      {tags.length ? (
        <ul className="wanted-card__tags" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag} className="wanted-card__tag">#{tag}</li>
          ))}
        </ul>
      ) : null}

      {/* Gold-leaf border decoration */}
      <span className="wanted-card__gold-border" aria-hidden="true" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Luffy mode — back: new One Piece / Straw Hat themed
// ---------------------------------------------------------------------------
function StrawHatBack({
  project,
  title,
  stack,
  additionalLinks,
  onNavigate,
  detailPath,
}: {
  project: Project;
  title: string;
  stack: string[];
  additionalLinks: ProjectLink[];
  onNavigate: () => void;
  detailPath: string;
}) {
  return (
    <div className="straw-hat-back" aria-hidden="true" data-testid="straw-hat-back">
      {/* One Piece logo watermark */}
      <img
        src="/assets/One-Piece/One-Piece-Logo-1416.webp"
        alt=""
        aria-hidden="true"
        className="straw-hat-back__watermark"
        loading="lazy"
        decoding="async"
      />

      <div className="straw-hat-back__inner">
        {/* "DON!" kana watermark */}
        <span className="straw-hat-back__don" aria-hidden="true">ドン！</span>

        {/* Chyron: STRAW HAT GAZETTE */}
        <div className="straw-hat-back__chyron" aria-hidden="true">
          STRAW HAT GAZETTE — VOL. {String(Math.abs((title.charCodeAt(0) ?? 65) % 99) + 1).padStart(2, '0')}
        </div>

        <h3 className="straw-hat-back__title">{title}</h3>

        {project.summary ? (
          <p className="straw-hat-back__desc">{project.summary}</p>
        ) : null}

        {stack.length ? (
          <ul className="straw-hat-back__stack" aria-label="Stack">
            {stack.map((item) => (
              <li key={item} className="straw-hat-back__stack-chip">{item}</li>
            ))}
          </ul>
        ) : null}

        <div className="straw-hat-back__ctas">
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
          <button
            type="button"
            className="straw-hat-back__log-btn"
            onClick={(e) => { e.stopPropagation(); onNavigate(); void detailPath; }}
            tabIndex={-1}
            aria-hidden="true"
          >
            READ THE LOG →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thor mode — front: new Asgardian tech card
// ---------------------------------------------------------------------------
function AsgardianFrontCard({
  project,
  slug,
  title,
  tags,
  coverUrl,
}: {
  project: Project;
  slug: string;
  title: string;
  tags: string[];
  coverUrl: string | undefined;
}) {
  return (
    <div className="asgardian-card__front" data-testid="asgardian-front">
      {/* Starfield background injected via CSS */}

      {/* Gold + blue double frame border (CSS border-image) */}
      <span className="asgardian-card__frame" aria-hidden="true" />

      {/* Runic status stamp */}
      <div className="asgardian-card__status-stamp" aria-hidden="true">
        <span
          className="asgardian-card__status-text"
          style={{ color: statusColor(project.status) }}
        >
          {runicStatusLabel(project.status)}
        </span>
      </div>

      {/* Cover image with Asgardian filter + gold corner brackets */}
      <div
        className="asgardian-card__photo"
        style={
          project.id
            ? ({ viewTransitionName: `project-cover-${project.id}` } as React.CSSProperties)
            : undefined
        }
      >
        <ImageFallback
          src={coverUrl}
          alt={project.heroImageAlt || `${title} cover`}
          aspect="golden"
          rounded="rounded-none"
          className="asgardian-card__img"
        />
        {/* Corner brackets */}
        <span className="asgardian-card__bracket asgardian-card__bracket--tl" aria-hidden="true" />
        <span className="asgardian-card__bracket asgardian-card__bracket--tr" aria-hidden="true" />
        <span className="asgardian-card__bracket asgardian-card__bracket--bl" aria-hidden="true" />
        <span className="asgardian-card__bracket asgardian-card__bracket--br" aria-hidden="true" />
        <CharacterOverlay slug={slug} />
      </div>

      {/* Title */}
      <div className="asgardian-card__nameplate">
        <h3 className="asgardian-card__title">{title}</h3>
        {project.subtitle ? (
          <p className="asgardian-card__subtitle">{project.subtitle}</p>
        ) : null}
        {/* Electric blue underline rendered via CSS */}
        <CaptainByline project={project} variant="thor" />
      </div>

      {/* Tag chips as runic rune-styled chips */}
      {tags.length ? (
        <ul className="asgardian-card__tags" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag} className="asgardian-card__tag">#{tag}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thor mode — back: existing Asgardian cinematic (unchanged from P1)
// ---------------------------------------------------------------------------
function AsgardianBack({
  project,
  title,
  stack,
  additionalLinks,
  onNavigate,
  detailPath,
}: {
  project: Project;
  title: string;
  stack: string[];
  additionalLinks: ProjectLink[];
  onNavigate: () => void;
  detailPath: string;
}) {
  return (
    <div className="wanted-card__back" aria-hidden="true" data-testid="asgardian-back">
      <div className="wanted-card__back-inner">
        <h3 className="wanted-card__back-title">{title}</h3>

        {project.summary ? (
          <p className="wanted-card__back-desc">{project.summary}</p>
        ) : null}

        {stack.length ? (
          <ul className="wanted-card__stack" aria-label="Stack">
            {stack.map((item) => (
              <li key={item} className="wanted-card__stack-chip">{item}</li>
            ))}
          </ul>
        ) : null}

        <div className="wanted-card__ctas">
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
          <button
            type="button"
            className="wanted-card__view-btn"
            onClick={(e) => { e.stopPropagation(); onNavigate(); void detailPath; }}
            tabIndex={-1}
            aria-hidden="true"
          >
            View detail →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectCard({ project, index }: Props) {
  const mode = useMode();
  const go = useViewTransitionNav();
  // Round 35 — mobile users have no hover state; the "i" info button
  // toggles a manual flip via the `data-flipped` attribute, which the
  // CSS combines with hover/focus to drive the rotateY animation.
  const [flipped, setFlipped] = useState(false);

  const title = project.title?.trim() || 'Untitled project';
  const slug = project.slug || project.id || `project-${index}`;
  const detailPath = `/projects/${slug}`;
  const bounty = getBountyLine(project);
  const tags = uniqueList(project.tags).slice(0, 5);
  const stack = uniqueList(project.stack).slice(0, 4);
  const additionalLinks = filterLinks(project.links).slice(0, 2);
  const isThor = mode === 'thor';
  // Resolve a mode-appropriate fallback when the project's coverUrl is empty
  // (typical for Supabase rows created via the admin UI without an upload).
  const coverUrl = resolveProjectCover(project, mode);

  const handleNavigate = useCallback(() => {
    go(detailPath);
  }, [go, detailPath]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go(detailPath);
      }
    },
    [go, detailPath],
  );

  // Round 75: placeholder badge — visible on every card whose row carries
  // `placeholder: true` (i.e. one of the bundled fixtures).  Lives outside
  // the front/back card faces so it sits on top of both flip states.
  const placeholderBadge = project.placeholder ? (
    <span className="project-card__placeholder-badge" aria-label="Placeholder example">
      PLACEHOLDER
    </span>
  ) : null;

  // Round 35 — mobile/touch info button. Sits in the top-right corner,
  // visible on touch devices (CSS hides on hover-capable pointers).
  // Click stops propagation so it doesn't trigger card navigation.
  const infoButton = (
    <button
      type="button"
      className="project-card__info-btn"
      aria-label={flipped ? 'Show front of card' : 'Show details on the back of the card'}
      aria-pressed={flipped}
      onClick={(e) => {
        e.stopPropagation();
        setFlipped((v) => !v);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
        }
      }}
    >
      {flipped ? '←' : 'i'}
    </button>
  );

  // Thor mode: Asgardian tech front + Asgardian cinematic back
  if (isThor) {
    return (
      <article
        role="gridcell"
        tabIndex={0}
        data-magnetic
        className="wanted-card asgardian-card"
        data-flipped={flipped || undefined}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
        aria-label={`${title} — ${statusLabel(project.status)}. Press Enter to view case study.`}
      >
        {placeholderBadge}
        {infoButton}
        <AsgardianFrontCard
          project={project}
          slug={slug}
          title={title}
          tags={tags}
          coverUrl={coverUrl}
        />
        <AsgardianBack
          project={project}
          title={title}
          stack={stack}
          additionalLinks={additionalLinks}
          onNavigate={handleNavigate}
          detailPath={detailPath}
        />
      </article>
    );
  }

  // Gear 5 mode: wanted poster front + One Piece themed back
  return (
    <article
      role="gridcell"
      tabIndex={0}
      data-magnetic
      className="wanted-card"
      data-flipped={flipped || undefined}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      aria-label={`${title} — ${statusLabel(project.status)}. Press Enter to view case study.`}
    >
      {placeholderBadge}
      <WantedFrontCard
        project={project}
        title={title}
        bounty={bounty}
        tags={tags}
        coverUrl={coverUrl}
      />
      <StrawHatBack
        project={project}
        title={title}
        stack={stack}
        additionalLinks={additionalLinks}
        onNavigate={handleNavigate}
        detailPath={detailPath}
      />
    </article>
  );
}
