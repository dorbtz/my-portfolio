/**
 * src/pages/admin/DossierCard.tsx
 *
 * Collapsible themed card for the Round 14 Project Dossier form redesign.
 * Splits the previously-monolithic form into 7 scannable sections:
 *   1. Identity   2. Story   3. Stack & Tags   4. Cover & Live Preview
 *   5. Links      6. Outcomes 7. Ownership
 *
 * Theming is inherited via the parent .admin-shell--thor / .admin-shell--manga
 * scope; the `.dossier-card` class lives in admin-dashboard.css.
 *
 * Default-collapsed cards (Outcomes, Ownership) start with `defaultOpen={false}`
 * so the form feels light on first load.
 */

import { useState, type ReactNode } from 'react';

export type DossierCardProps = {
  title: ReactNode;
  /** Small leading glyph or eyebrow text. */
  badge?: ReactNode;
  /** When true, body is open on first render. Defaults to true. */
  defaultOpen?: boolean;
  /** Read-only (non-collapsible) when true. */
  staticOpen?: boolean;
  /** Body content — typically a grid of AdminField wrappers. */
  children: ReactNode;
  /** Optional id for anchor links / scrollIntoView. */
  id?: string;
};

export function DossierCard({
  title,
  badge,
  defaultOpen = true,
  staticOpen = false,
  children,
  id,
}: DossierCardProps) {
  const [open, setOpen] = useState(staticOpen || defaultOpen);
  const isOpen = staticOpen || open;
  return (
    <section
      id={id}
      className="dossier-card"
      data-open={isOpen ? 'true' : 'false'}
    >
      {staticOpen ? (
        <div className="dossier-card__header">
          <h3 className="dossier-card__title">
            {badge && <span aria-hidden="true">{badge}</span>}
            {title}
          </h3>
        </div>
      ) : (
        <button
          type="button"
          className="dossier-card__header"
          aria-expanded={isOpen}
          aria-controls={id ? `${id}-body` : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          <h3 className="dossier-card__title">
            {badge && <span aria-hidden="true">{badge}</span>}
            {title}
          </h3>
          <span className="dossier-card__chevron" aria-hidden="true">▾</span>
        </button>
      )}
      <div
        className="dossier-card__body"
        id={id ? `${id}-body` : undefined}
        role="group"
      >
        {children}
      </div>
    </section>
  );
}
