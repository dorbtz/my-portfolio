/**
 * src/features/content/admin/ModeTabs.tsx
 *
 * Round 29 — top-of-page tab switcher between Thor mode and Gear 5 mode for
 * the live-preview content admin pages. Returns the active tab so the parent
 * decides which draft to render.
 *
 * Cheap implementation — one button per mode + aria-pressed semantics.
 * No external icons (text labels only) so the bundle stays tiny.
 */

import { useState, type ReactNode } from 'react';
import type { SiteMode } from '../types';

type Props = {
  /** Initial active mode — defaults to 'thor'. */
  initial?: SiteMode;
  /** Render the panel for the active mode. */
  children: (mode: SiteMode) => ReactNode;
  /** Optional override labels — defaults to "Thor" / "Gear 5". */
  thorLabel?: string;
  gear5Label?: string;
};

export default function ModeTabs({
  initial = 'thor',
  children,
  thorLabel = 'Thor mode',
  gear5Label = 'Gear 5 / Luffy mode',
}: Props) {
  const [mode, setMode] = useState<SiteMode>(initial);
  return (
    <>
      <div className="mode-tabs" role="tablist" aria-label="Edit mode">
        <button
          type="button"
          role="tab"
          aria-pressed={mode === 'thor'}
          aria-selected={mode === 'thor'}
          className="mode-tabs__btn"
          onClick={() => setMode('thor')}
        >
          {thorLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-pressed={mode === 'gear5'}
          aria-selected={mode === 'gear5'}
          className="mode-tabs__btn"
          onClick={() => setMode('gear5')}
        >
          {gear5Label}
        </button>
      </div>
      {children(mode)}
    </>
  );
}
