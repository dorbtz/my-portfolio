/**
 * src/features/content/admin/HeroContentAdmin.tsx
 *
 * Round 30 — Mode-split edit. Reads the active site mode via `useMode()` and
 * renders ONLY that mode's draft. Switching to the other mode in the global
 * toggle reloads this page with the other mode's data. No more inline mode
 * tabs — the focused editing surface mirrors the live experience.
 *
 * Round 29 (kept) — renders a faithful clone of the live Hero section with
 * `<InlineEdit>` wrappers. Saves go to Supabase via `useContentEditor.saveField`
 * on each blur/Enter — no global Save button required (the SaveBar still
 * exists for manual flush convenience).
 */

import ContentAdminShell from './ContentAdminShell';
import { useContentEditor } from './useContentEditor';
import RotatingListEditor from './RotatingListEditor';
import InlineEdit from './InlineEdit';
import { AdminField } from '../../../pages/admin/AdminField';
import { useMode } from '../../../stores/mode';
import type { SiteMode } from '../types';

// ---------------------------------------------------------------------------
// HeroPreview — renders the live Hero layout for a given mode using the
// admin's draft state. CSS classes mirror the homepage so the visual stays
// consistent without duplicating styles.
// ---------------------------------------------------------------------------

function HeroPreview({
  mode,
  draft,
  onSaveField,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
}) {
  const isThor = mode === 'thor';
  const titles = Array.isArray(draft.rotatingTitles) ? (draft.rotatingTitles as string[]) : [];
  const sampleTitle = titles[0] ?? '(rotating title)';

  // Helper: bind an InlineEdit to a specific draft field.
  const bind = (field: string) => ({
    value: String(draft[field] ?? ''),
    onSave: (next: string) => onSaveField(field, next),
  });

  return (
    <div className={`content-preview hero-preview hero-preview--${mode}`}>
      <span className="content-preview__legend">Hero · {isThor ? 'Thor' : 'Gear 5'} preview</span>

      {/* Paragraph (matches the live hero paragraph layout) */}
      <p
        className="relative z-10 max-w-xl text-lg leading-7 sm:text-xl sm:leading-8 mt-2"
        style={{ color: 'rgb(var(--color-muted) / 0.85)' }}
      >
        <InlineEdit multiline {...bind('paragraphPrefix')} ariaLabel="Edit paragraph prefix">
          {(v) => <span>{v}</span>}
        </InlineEdit>{' '}
        <span className="font-medium" style={{ color: 'rgb(var(--color-ink))' }}>
          {sampleTitle}
        </span>{' '}
        <InlineEdit {...bind('paragraphSuffix')} ariaLabel="Edit paragraph suffix">
          {(v) => <span>{v}</span>}
        </InlineEdit>
      </p>

      {/* Rotating titles editor — preserves the existing list affordance.
          Per-row editing is its own UX so we keep RotatingListEditor here. */}
      <AdminField
        label="Rotating titles (cycled into the paragraph)"
        hint="Drag to reorder. Empty list falls back to baked-in defaults."
        className="mt-4"
      >
        <RotatingListEditor
          items={titles}
          onChange={(next) => void onSaveField('rotatingTitles', next)}
          placeholder={isThor ? 'New Asgardian title…' : 'New Gear 5 title…'}
          addLabel="title"
        />
      </AdminField>

      {/* CTA buttons — visual clone of the live CTAs */}
      <div className="flex flex-wrap gap-3 mt-4">
        <span className="hire-me-btn hire-me-btn--secondary" data-thor-hover>
          <InlineEdit {...bind('cta1Label')} ariaLabel="Edit CTA 1 label">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </span>
        <span className="hire-me-btn" data-thor-hover>
          <InlineEdit {...bind('cta2Label')} ariaLabel="Edit CTA 2 label">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </span>
      </div>

      {/* 3 stat tiles — same .glass-tile / .hero-stat-tile classes as live */}
      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        {(['Specialty', 'Stack', 'Availability'] as const).map((bag) => {
          const labelKey = `stat${bag}Label`;
          const valueKey = `stat${bag}Value`;
          const detailKey = `stat${bag}Detail`;
          return (
            <div key={bag} className="glass-tile hero-stat-tile rounded-2xl space-y-2">
              <span
                className="text-xs uppercase tracking-[0.26em] block"
                style={{ color: 'rgb(var(--color-muted) / 0.65)' }}
              >
                <InlineEdit {...bind(labelKey)} ariaLabel={`Edit ${bag} label`}>
                  {(v) => <span>{v}</span>}
                </InlineEdit>
              </span>
              <p className="text-lg font-semibold" style={{ color: 'rgb(var(--color-ink))' }}>
                <InlineEdit {...bind(valueKey)} ariaLabel={`Edit ${bag} value`}>
                  {(v) => <span>{v}</span>}
                </InlineEdit>
              </p>
              <p className="text-sm leading-5" style={{ color: 'rgb(var(--color-muted) / 0.85)' }}>
                <InlineEdit multiline {...bind(detailKey)} ariaLabel={`Edit ${bag} detail`}>
                  {(v) => <span>{v}</span>}
                </InlineEdit>
              </p>
            </div>
          );
        })}
      </div>

      {/* Mode toggle tile — matches the live hero stat-tile-toggle. We render
          it as a plain-styled card here (no real toggle state) so admins can
          edit each slot. */}
      <fieldset
        className="border rounded-md p-3 mt-6"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <legend className="text-xs uppercase tracking-wider opacity-70 px-1">
          Mode toggle tile
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="glass-tile hero-stat-tile rounded-2xl space-y-1">
            <span
              className="text-xs uppercase tracking-[0.26em] block"
              style={{ color: 'rgb(var(--color-muted) / 0.65)' }}
            >
              <InlineEdit {...bind('modeToggleLabel')} ariaLabel="Edit mode toggle label">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </span>
            <p className="text-base font-semibold opacity-80" style={{ color: 'rgb(var(--color-highlight))' }}>
              ●{' '}
              <InlineEdit {...bind('modeToggleActiveValue')} ariaLabel="Active value">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
            <p className="text-xs leading-5 opacity-80">
              <InlineEdit multiline {...bind('modeToggleActiveDetail')} ariaLabel="Active detail">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>
          <div className="glass-tile hero-stat-tile rounded-2xl space-y-1">
            <span className="text-xs uppercase tracking-[0.26em] block opacity-70">DORMANT</span>
            <p className="text-base font-semibold opacity-80" style={{ color: 'rgb(var(--color-ink))' }}>
              ○{' '}
              <InlineEdit {...bind('modeToggleDormantValue')} ariaLabel="Dormant value">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
            <p className="text-xs leading-5 opacity-80">
              <InlineEdit multiline {...bind('modeToggleDormantDetail')} ariaLabel="Dormant detail">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>
        </div>
      </fieldset>

      {/* Latest-drop tile fallbacks (rarely changed but exposed for safety). */}
      <fieldset
        className="border rounded-md p-3 mt-4"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <legend className="text-xs uppercase tracking-wider opacity-70 px-1">
          Latest-drop tile fallbacks
        </legend>
        <div className="glass-tile hero-stat-tile rounded-2xl space-y-1">
          <span className="text-xs uppercase tracking-[0.26em] block opacity-70">
            <InlineEdit {...bind('latestDropLabel')} ariaLabel="Latest drop label">
              {(v) => <span>{v}</span>}
            </InlineEdit>
          </span>
          <p className="text-base font-semibold">
            <InlineEdit {...bind('latestDropFallbackTitle')} ariaLabel="Fallback title">
              {(v) => <span>{v}</span>}
            </InlineEdit>
          </p>
          <p className="text-xs leading-5 opacity-80">
            <InlineEdit multiline {...bind('latestDropFallbackDetail')} ariaLabel="Fallback detail">
              {(v) => <span>{v}</span>}
            </InlineEdit>
          </p>
        </div>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HeroContentAdmin() {
  const editor = useContentEditor('hero');
  const mode = useMode();
  const isThor = mode === 'thor';
  return (
    <ContentAdminShell
      eyebrow={isThor ? '// HERO' : '// FRONT DECK SAIL'}
      title={isThor ? 'Hero' : 'Front deck sail'}
      section="content-hero"
      description={
        isThor
          ? 'Click any text below to edit it in place. Changes save on blur (or press Enter).'
          : "Click any text on the front deck sail to rewrite it. Changes save on blur (or press Enter). Switch to Thor mode in the global toggle to edit Asgard's banner."
      }
      feedback={<SaveBar editor={editor} />}
    >
      <HeroPreview
        mode={mode}
        draft={isThor ? editor.thor : editor.gear5}
        onSaveField={(field, value) => editor.saveField(mode, field, value)}
      />
    </ContentAdminShell>
  );
}

// ---------------------------------------------------------------------------
// SaveBar — shared across every admin/content page. Accepts the minimal
// interface needed (status + reset + save) so the Skills editor (which has a
// different draft shape) can use it without conforming to useContentEditor.
// ---------------------------------------------------------------------------
type SaveBarMinimal = {
  status: 'idle' | 'saving' | 'success' | 'error';
  error: string | null;
  save: () => Promise<void>;
  reset: () => void;
};
type SaveBarProps = { editor: SaveBarMinimal };
export function SaveBar({ editor }: SaveBarProps) {
  return (
    <div className="admin-card admin-card--inline p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs opacity-75">
        {editor.status === 'success' && 'Saved.'}
        {editor.status === 'saving' && 'Saving…'}
        {editor.status === 'error' && (
          <span className="text-rose-300/80">
            Save failed: {editor.error ?? 'unknown error'}
          </span>
        )}
        {editor.status === 'idle' && 'Click any text to edit. Changes save on blur or Enter.'}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="admin-btn"
          onClick={editor.reset}
          disabled={editor.status === 'saving'}
        >
          Reset
        </button>
        <button
          type="button"
          className="admin-cta admin-cta--primary"
          onClick={() => void editor.save()}
          disabled={editor.status === 'saving'}
          aria-busy={editor.status === 'saving'}
        >
          {editor.status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
