/**
 * src/features/content/admin/AdminContentAdmin.tsx
 *
 * Round 64 — Phase B of the hidden D-B-T admin entry.  Edits the
 * `admin` site-content section (sequence + gap) per mode.  The CMS
 * stores the data via the same `useContentEditor` machinery used by
 * every other content editor; LogoBlock reads it at runtime through
 * `useSiteContent('admin')`.
 *
 * UX:
 *   - The "DOR BEN TZUR" wordmark is rendered as an interactive grid
 *     of letter buttons.  Clicking a letter toggles its membership in
 *     the sequence; click order defines the click order required at
 *     runtime.  Selected letters get a 1 / 2 / 3 ordinal badge and a
 *     coloured outline.
 *   - A number input controls `secretGapMs` (max delay between clicks).
 *   - "Reset to default" restores [0, 4, 8] / 1000 ms for the active
 *     mode without touching the other mode.
 *   - Every interaction calls `editor.saveField` so changes commit on
 *     blur / click — same pattern the live-preview editors use.
 *
 * The wordmark constant `LOGO_TEXT` is duplicated here intentionally;
 * pulling it from Header.tsx would create a cycle (Header imports the
 * defaults this page edits).  Kept short and well-commented.
 */

import { useMemo } from 'react';
import ContentAdminShell from './ContentAdminShell';
import { SaveBar } from './HeroContentAdmin';
import { useContentEditor } from './useContentEditor';
import { useMode } from '../../../stores/mode';
import { ADMIN_DEFAULTS } from '../hooks/siteContentDefaults';
import type { SiteMode } from '../types';

const LOGO_TEXT = 'DOR BEN TZUR';
const SEQUENCE_GAP_MIN = 50;
const SEQUENCE_GAP_MAX = 5000;

/** Strict parse — returns the array if it looks safe, else `null`.  Same
 *  shape Header.tsx applies before runtime so the UI shows exactly what
 *  the live header would honour. */
function parseSequence(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: number[] = [];
  const seen = new Set<number>();
  for (const v of raw) {
    if (typeof v !== 'number' || !Number.isInteger(v)) return null;
    if (v < 0 || v >= LOGO_TEXT.length) return null;
    if (LOGO_TEXT[v] === ' ') return null;
    if (seen.has(v)) return null;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function parseGapMs(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  if (raw < SEQUENCE_GAP_MIN || raw > SEQUENCE_GAP_MAX) return null;
  return raw;
}

function ordinalLabel(n: number): string {
  // 1st, 2nd, 3rd, 4th, …  Used as a tiny badge on selected letters.
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

type EditorAPI = ReturnType<typeof useContentEditor>;

function ModePanel({
  mode,
  draft,
  saveField,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  saveField: EditorAPI['saveField'];
}) {
  // Resolve the sequence + gap with strict validation, falling back to
  // the in-code defaults exactly like LogoBlock does at runtime.
  const sequence = useMemo<number[]>(
    () => parseSequence(draft.secretSequence) ?? [...ADMIN_DEFAULTS[mode].secretSequence],
    [draft.secretSequence, mode],
  );
  const gapMs = useMemo<number>(
    () => parseGapMs(draft.secretGapMs) ?? ADMIN_DEFAULTS[mode].secretGapMs,
    [draft.secretGapMs, mode],
  );

  // Map letter index → its ordinal in the sequence (1-based), or 0 if not selected.
  const ordinalByIdx = useMemo<Map<number, number>>(() => {
    const m = new Map<number, number>();
    sequence.forEach((idx, i) => m.set(idx, i + 1));
    return m;
  }, [sequence]);

  function commitSequence(next: number[]) {
    void saveField(mode, 'secretSequence', next);
  }
  function commitGap(next: number) {
    void saveField(mode, 'secretGapMs', next);
  }

  function toggleLetter(idx: number) {
    if (LOGO_TEXT[idx] === ' ') return;
    if (ordinalByIdx.has(idx)) {
      // Remove and re-pack ordinals.
      commitSequence(sequence.filter((i) => i !== idx));
    } else {
      commitSequence([...sequence, idx]);
    }
  }

  function resetToDefault() {
    commitSequence([...ADMIN_DEFAULTS[mode].secretSequence]);
    commitGap(ADMIN_DEFAULTS[mode].secretGapMs);
  }

  function handleGapChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Live state — just for feedback; the actual save happens on blur.
    // We don't reflect this back into the draft until blur to avoid
    // chatter on every keystroke.
    e.currentTarget.dataset.dirty = 'true';
  }

  function handleGapBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = Number(e.currentTarget.value);
    if (Number.isFinite(raw) && raw >= SEQUENCE_GAP_MIN && raw <= SEQUENCE_GAP_MAX) {
      if (raw !== gapMs) commitGap(raw);
    } else {
      // Snap back to the last good value.
      e.currentTarget.value = String(gapMs);
    }
  }

  // Pretty-print: "D · B · T"  (skip empty selections gracefully).
  const sequencePreview = sequence.length
    ? sequence.map((i) => LOGO_TEXT[i]).join(' · ')
    : '(empty — secret disabled)';

  return (
    <section className="admin-card admin-card--inline p-4 md:p-5" data-content-pane={mode}>
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="admin-card__heading" style={{ marginBottom: 4 }}>
            {mode === 'thor' ? 'Thor mode' : 'Gear 5 mode'}
          </h2>
          <p className="text-xs opacity-70">
            Click letters in the order you want them pressed.  Click again to remove.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={resetToDefault}
          aria-label={`Reset ${mode} sequence to default`}
        >
          Reset to default
        </button>
      </header>

      {/* Wordmark picker */}
      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] opacity-65 mb-2">
          Wordmark
        </p>
        <div className="admin-secret-wordmark">
          {Array.from(LOGO_TEXT).map((char, i) => {
            if (char === ' ') {
              return (
                <span key={i} className="admin-secret-wordmark__space" aria-hidden="true">
                  {' '}
                </span>
              );
            }
            const ordinal = ordinalByIdx.get(i) ?? 0;
            const selected = ordinal > 0;
            return (
              <button
                key={i}
                type="button"
                className={[
                  'admin-secret-wordmark__letter',
                  selected ? 'admin-secret-wordmark__letter--on' : '',
                ].join(' ')}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? `${char} (position ${i}, ${ordinalLabel(ordinal)} in sequence). Click to remove.`
                    : `${char} (position ${i}). Click to add to sequence.`
                }
                onClick={() => toggleLetter(i)}
              >
                <span className="admin-secret-wordmark__letter-char">{char}</span>
                {selected && (
                  <span className="admin-secret-wordmark__letter-badge" aria-hidden="true">
                    {ordinal}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs opacity-75 mt-2">
          Sequence: <strong className="opacity-90">{sequencePreview}</strong>{' '}
          <span className="opacity-60">
            ({sequence.length} click{sequence.length === 1 ? '' : 's'} required)
          </span>
        </p>
      </div>

      {/* Gap input */}
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <label htmlFor={`admin-secret-gap-${mode}`} className="text-xs uppercase tracking-[0.2em] opacity-65">
          Max gap between clicks (ms)
        </label>
        <input
          id={`admin-secret-gap-${mode}`}
          type="number"
          inputMode="numeric"
          className="admin-secret-gap-input"
          defaultValue={gapMs}
          min={SEQUENCE_GAP_MIN}
          max={SEQUENCE_GAP_MAX}
          step={50}
          onChange={handleGapChange}
          onBlur={handleGapBlur}
          aria-describedby={`admin-secret-gap-${mode}-hint`}
        />
        <span id={`admin-secret-gap-${mode}-hint`} className="text-xs opacity-60">
          {SEQUENCE_GAP_MIN}–{SEQUENCE_GAP_MAX} ms.  Default: {ADMIN_DEFAULTS[mode].secretGapMs} ms.
        </span>
      </div>
    </section>
  );
}

export default function AdminContentAdmin() {
  const editor = useContentEditor('admin');
  const mode = useMode();
  const isThor = mode === 'thor';
  return (
    <ContentAdminShell
      eyebrow={isThor ? '// HIDDEN ENTRY' : 'CAPTAIN’S BACK DOOR'}
      title={isThor ? 'Admin entry sequence' : 'Captain’s back-door click'}
      section="content-admin"
      description={
        isThor
          ? 'Click letters of the wordmark to set the secret entry click sequence — runs in this mode only.'
          : 'Tap letters in the captain’s name to set the back-door knock — only fires while Luffy mode is active.'
      }
      feedback={<SaveBar editor={editor} />}
    >
      <ModePanel
        mode={mode}
        draft={isThor ? editor.thor : editor.gear5}
        saveField={editor.saveField}
      />
    </ContentAdminShell>
  );
}
