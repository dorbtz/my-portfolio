/**
 * src/features/content/admin/ProjectsCopyAdmin.tsx
 *
 * Round 30 — Mode-split edit. Reads the active mode via `useMode()` and
 * renders ONLY that mode's projects-section copy. The same fields are now
 * inlined at the top of /admin/projects (Wanted Wall) so editing project
 * rows + their surrounding copy lives on a single page; this route stays
 * accessible for deep-links.
 *
 * Round 29 (kept) — renders a faithful preview of the projects-page
 * search/filter strip (search input + 3 focus chips + empty-state) with
 * `<InlineEdit>` wrappers.
 */

import ContentAdminShell from './ContentAdminShell';
import { useContentEditor } from './useContentEditor';
import { SaveBar } from './HeroContentAdmin';
import RotatingListEditor from './RotatingListEditor';
import InlineEdit from './InlineEdit';
import { AdminField } from '../../../pages/admin/AdminField';
import { useMode } from '../../../stores/mode';
import type { SiteMode } from '../types';

function ProjectsCopyPreview({
  mode,
  draft,
  onSaveField,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
}) {
  const focusAreas = Array.isArray(draft.focusAreas) ? (draft.focusAreas as string[]) : [];
  const bind = (field: string) => ({
    value: String(draft[field] ?? ''),
    onSave: (next: string) => onSaveField(field, next),
  });
  return (
    <div className="content-preview">
      <span className="content-preview__legend">
        Projects · {mode === 'thor' ? 'Thor' : 'Gear 5'} preview
      </span>

      {/* Search input preview — readonly so the placeholder shows. */}
      <div className="grid gap-3 mt-2">
        <label className="text-xs uppercase tracking-wider opacity-70">Search input</label>
        <input
          type="text"
          readOnly
          tabIndex={-1}
          placeholder={String(draft.searchPlaceholder ?? '')}
          className="admin-field__input"
          aria-label="Search preview"
        />
        <p className="text-xs opacity-70">
          Placeholder text:{' '}
          <InlineEdit {...bind('searchPlaceholder')} ariaLabel="Search placeholder">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </p>
      </div>

      {/* Focus chips — preview row + editor */}
      <div className="grid gap-3 mt-5">
        <label className="text-xs uppercase tracking-wider opacity-70">Focus chips</label>
        <div className="flex flex-wrap gap-2">
          {focusAreas.length === 0 ? (
            <span className="text-xs opacity-60">(no chips yet — add some below)</span>
          ) : (
            focusAreas.map((chip, i) => (
              <span
                key={`${i}-${chip}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                style={{
                  background:
                    mode === 'thor' ? 'rgba(118,207,255,.16)' : '#ffe9b2',
                  color: mode === 'thor' ? '#76cfff' : '#1a0d05',
                  border:
                    mode === 'thor'
                      ? '1px solid rgba(118,207,255,.4)'
                      : '1.5px solid #1a0d05',
                }}
              >
                {chip}
              </span>
            ))
          )}
        </div>
        <AdminField
          label="Edit chips (drag to reorder, ~3 works best)"
          hint="Empty entries are blocked. Soft cap at 6."
        >
          <RotatingListEditor
            items={focusAreas}
            onChange={(next) => void onSaveField('focusAreas', next)}
            placeholder={mode === 'thor' ? 'New realm chip…' : 'New crew chip…'}
            addLabel="chip"
            max={6}
          />
        </AdminField>
      </div>

      {/* Empty state preview */}
      <div className="grid gap-3 mt-5">
        <label className="text-xs uppercase tracking-wider opacity-70">
          Empty-state message (shown when no projects match search)
        </label>
        <div
          className="rounded-lg p-4 text-center text-sm"
          style={{
            background: mode === 'thor' ? 'rgba(7,16,30,.5)' : '#fffaef',
            border:
              mode === 'thor'
                ? '1px dashed rgba(118,207,255,.3)'
                : '2px dashed #1a0d05',
            color: mode === 'thor' ? 'rgba(255,255,255,.85)' : '#1a0d05',
          }}
        >
          <InlineEdit multiline {...bind('emptyState')} ariaLabel="Empty state">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsCopyAdmin() {
  const editor = useContentEditor('projects');
  const mode = useMode();
  const isThor = mode === 'thor';
  return (
    <ContentAdminShell
      eyebrow={isThor ? '// PROJECTS COPY' : '// BOUNTY BOARD COPY'}
      title={isThor ? 'Projects section copy' : 'Bounty board copy'}
      section="content-projects"
      description={
        isThor
          ? 'Click any text to edit it. (For project rows themselves, see /admin/projects.)'
          : 'Click any line of the wanted-wall pitch to rewrite it. (Bounty rows live on the Wanted Wall page itself, which now also shows these fields inline.)'
      }
      feedback={<SaveBar editor={editor} />}
    >
      <ProjectsCopyPreview
        mode={mode}
        draft={isThor ? editor.thor : editor.gear5}
        onSaveField={(field, value) => editor.saveField(mode, field, value)}
      />
    </ContentAdminShell>
  );
}
