/**
 * src/features/content/admin/AboutContentAdmin.tsx
 *
 * Round 30 — Mode-split edit. Reads the active mode via `useMode()` and
 * renders ONLY that mode's About draft. Switching modes in the global
 * toggle reloads this page focused on the other mode.
 *
 * Round 29 (kept) — renders the live About section's comic-panel layout
 * (5 panels + 3 SFX bursts) with `<InlineEdit>` on every editable text.
 */

import ContentAdminShell from './ContentAdminShell';
import { useContentEditor } from './useContentEditor';
import { SaveBar } from './HeroContentAdmin';
import InlineEdit from './InlineEdit';
import { useMode } from '../../../stores/mode';
import type { SiteMode } from '../types';

// Panel index → modifier class.  Mirrors the live About section so the
// per-panel Thor gradient skin (cosmic blue / Asgardian purple / Mjolnir
// red / sea-green / lightning gold) reads correctly in the admin
// preview.  Panel 5 also carries the mode-specific `--next-*` flag.
const PANELS = [1, 2, 3, 4, 5] as const;
const PANEL_VARIANTS: Record<number, string> = {
  1: 'comic-panel--beginning',
  2: 'comic-panel--training',
  3: 'comic-panel--battle',
  4: 'comic-panel--team',
  5: 'comic-panel--next',
};

function PanelPreview({
  n,
  isThor,
  draft,
  onSaveField,
}: {
  n: number;
  isThor: boolean;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
}) {
  const bind = (field: string) => ({
    value: String(draft[field] ?? ''),
    onSave: (next: string) => onSaveField(field, next),
  });
  const variant = PANEL_VARIANTS[n] ?? '';
  // Panel 5 has mode-specific awakening variants — the Thor block in
  // index.css scopes its gradient with `:root[data-mode="thor"]`, so
  // we just append the matching `--next-thor` / `--next-gear5` flag.
  const nextSuffix =
    n === 5 ? (isThor ? ' comic-panel--next-thor' : ' comic-panel--next-gear5') : '';

  return (
    <article
      className={`comic-panel ${variant}${nextSuffix}`}
      style={{ minHeight: 'auto' }}
    >
      <span aria-hidden="true" className="comic-halftone" />
      <header className="comic-panel__kicker">
        <InlineEdit {...bind(`panel${n}Kicker`)} ariaLabel={`Panel ${n} kicker`}>
          {(v) => <span>{v}</span>}
        </InlineEdit>
      </header>
      <div className="comic-panel__body">
        <p>
          <InlineEdit multiline {...bind(`panel${n}Body1`)} ariaLabel={`Panel ${n} body 1`}>
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </p>
        <p>
          <InlineEdit multiline {...bind(`panel${n}Body2`)} ariaLabel={`Panel ${n} body 2`}>
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </p>
      </div>
      <footer className="comic-panel__caption">
        <InlineEdit {...bind(`panel${n}Caption`)} ariaLabel={`Panel ${n} caption`}>
          {(v) => <span>{v}</span>}
        </InlineEdit>
      </footer>
    </article>
  );
}

function BurstChip({
  field,
  draft,
  onSaveField,
  fallback,
}: {
  field: string;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
  fallback: string;
}) {
  return (
    <div
      className="comic-sfx-burst"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <InlineEdit
        value={String(draft[field] ?? '')}
        onSave={(next) => onSaveField(field, next)}
        ariaLabel={`Edit ${field}`}
      >
        {(v) => <span>{v || fallback}</span>}
      </InlineEdit>
    </div>
  );
}

function AboutPreview({
  mode,
  draft,
  onSaveField,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
}) {
  const isThor = mode === 'thor';
  return (
    <div className={`content-preview admin-shell--${isThor ? 'thor' : 'manga'}`}>
      <span className="content-preview__legend">About · {isThor ? 'Thor' : 'Gear 5'} comic page</span>

      {/* SFX bursts row at the top — easier than placing them per-panel and
          gives the admin a single place to tune the 3 onomatopoeia. */}
      <fieldset
        className="border rounded-md p-3 mb-4"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <legend className="text-xs uppercase tracking-wider opacity-70 px-1">
          SFX bursts (3 onomatopoeia rendered as comic-style speech-bubble bursts)
        </legend>
        <div className="grid gap-3 md:grid-cols-3">
          {([1, 2, 3] as const).map((b) => (
            <BurstChip
              key={b}
              field={`burst${b}`}
              draft={draft}
              onSaveField={onSaveField}
              fallback={`Burst ${b}`}
            />
          ))}
        </div>
      </fieldset>

      {/* The 5 comic panels — Thor-mode panel skin (per-panel gradients,
          double-stroke frames, gold kicker chips) is driven by the
          per-panel modifier classes, NOT by `.comic-page`. Using a clean
          flex column here avoids inheriting the homepage's `grid-
          template-areas` (which would force the 2x3 named layout and
          collide panels in this single-column edit view). */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {PANELS.map((n) => (
          <PanelPreview key={n} n={n} isThor={isThor} draft={draft} onSaveField={onSaveField} />
        ))}
      </div>

      {/* Final-panel caption override (panel 5 has a Gear 5 awakening
          variant). Each panel above already covers its own caption — but
          leave a hint that switching modes will surface different defaults. */}
      <p className="text-xs opacity-60 mt-3">
        Tip: Panel 5 ("WHAT'S NEXT") has different defaults per mode. Click each text to override.
      </p>
    </div>
  );
}

export default function AboutContentAdmin() {
  const editor = useContentEditor('about');
  const mode = useMode();
  const isThor = mode === 'thor';
  return (
    <ContentAdminShell
      eyebrow={isThor ? '// ABOUT' : '// LOGBOOK'}
      title={isThor ? 'About' : 'Captain’s logbook'}
      section="content-about"
      description={
        isThor
          ? 'Click any text in the comic panels to edit it. Changes save on blur.'
          : 'Click any panel of the logbook to pen a new line. Changes save on blur. Flip to Thor mode in the global toggle to edit Asgard’s comic.'
      }
      feedback={<SaveBar editor={editor} />}
    >
      <AboutPreview
        mode={mode}
        draft={isThor ? editor.thor : editor.gear5}
        onSaveField={(field, value) => editor.saveField(mode, field, value)}
      />
    </ContentAdminShell>
  );
}
