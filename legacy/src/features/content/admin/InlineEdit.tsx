/**
 * src/features/content/admin/InlineEdit.tsx
 *
 * Round 29 — inline-edit primitive that wraps any text element and provides
 * click-to-edit affordance. Used by the rebuilt admin/content pages so the
 * admin sees the live feature layout instead of a flat list of inputs.
 *
 * Behaviour:
 *   - Idle: render the wrapped element via `children(value)`. On hover, a
 *     subtle dashed outline + pencil glyph appears to signal interactivity.
 *   - Editing: replace the element with an `<input>` (or `<textarea>` when
 *     `multiline`). Auto-focus + select-all on enter.
 *   - Commit: blur OR Enter (single-line) calls `onSave` then exits edit
 *     mode. The optimistic value is shown until save resolves.
 *   - Cancel: Escape returns to render mode without saving.
 *   - Saving: input disabled, small spinner glyph.
 *
 * No props needed for placement — the wrapped element keeps its own DOM
 * spot in the layout. The InlineEdit `<span>` is `display: contents`
 * during render mode (so it doesn't disturb grids) and reverts to
 * `inline-block` only while the input is mounted.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  /** Current value rendered by `children`. */
  value: string;
  /** Persists the new value. Returns a promise so the input can be disabled
   *  during the round-trip. Errors should be re-thrown so InlineEdit can
   *  fall back to the previous value. */
  onSave: (next: string) => Promise<void> | void;
  /** Use a textarea instead of input — for paragraphs / long fields. */
  multiline?: boolean;
  /** Placeholder shown in the input when empty. */
  placeholder?: string;
  /** Render-prop: receives the live (optimistic) value and renders the
   *  display element. Wrap whatever JSX would normally render. */
  children: (value: string) => ReactNode;
  /** Optional aria-label override (defaults to "Edit"). */
  ariaLabel?: string;
};

export default function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder,
  children,
  ariaLabel = 'Edit',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  // Optimistic local value — shows new text immediately after save commits.
  const [optimistic, setOptimistic] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Re-sync when the underlying value changes (e.g. mode switch loaded fresh
  // copy) and we're not currently editing.
  useEffect(() => {
    if (!editing) {
      setDraft(value);
      setOptimistic(value);
    }
  }, [value, editing]);

  // Auto-focus + select-all when entering edit mode.
  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    try {
      el.select();
    } catch {
      /* old browsers — ignore */
    }
  }, [editing]);

  const commit = useCallback(async () => {
    if (!editing) return;
    const next = draft;
    if (next === optimistic) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setOptimistic(next);
      setEditing(false);
    } catch {
      // Revert to last-known on failure
      setDraft(optimistic);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, editing, onSave, optimistic]);

  const cancel = useCallback(() => {
    setDraft(optimistic);
    setEditing(false);
  }, [optimistic]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
      return;
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      void commit();
    }
    // Cmd/Ctrl+Enter commits multiline
    if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void commit();
    }
  };

  if (editing) {
    const sharedProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      className: 'inline-edit__input',
      value: draft,
      placeholder,
      disabled: saving,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: () => void commit(),
      onKeyDown,
      'aria-busy': saving,
      'aria-label': ariaLabel,
    } as const;
    return (
      <span className="inline-edit inline-edit--editing">
        {multiline ? (
          <textarea rows={Math.max(2, Math.ceil(draft.length / 60))} {...sharedProps} />
        ) : (
          <input type="text" {...sharedProps} />
        )}
        {saving && (
          <span className="inline-edit__spinner" aria-hidden="true">
            …
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className="inline-edit"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(true);
        }
      }}
    >
      {children(optimistic)}
      <span className="inline-edit__pencil" aria-hidden="true">
        ✎
      </span>
    </span>
  );
}
