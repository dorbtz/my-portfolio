/**
 * src/features/content/admin/RotatingListEditor.tsx
 *
 * Reusable list editor for arrays of strings:
 *   - Add (+) at the bottom
 *   - Delete (×) per row
 *   - Drag to reorder via HTML5 drag-and-drop (keyboard-accessible up/down
 *     buttons too — keeps WCAG happy without third-party deps)
 *
 * Used by Hero rotating titles, About SFX bursts, Projects focus chips,
 * etc. ~80 LOC, no extra deps.
 */

import { useCallback, useId, useState } from 'react';
import type { DragEvent } from 'react';

type Props = {
  /** Current list of items. Controlled by the parent. */
  items: string[];
  /** Called whenever the list changes (add/edit/remove/reorder). */
  onChange: (next: string[]) => void;
  /** Placeholder for new-row input. */
  placeholder?: string;
  /** Maximum allowed items (UI-only soft limit). */
  max?: number;
  /** Visible label for the new-row input. */
  addLabel?: string;
  /** Optional minimum length validation message — empty strings are blocked. */
  emptyDisallowed?: boolean;
};

export default function RotatingListEditor({
  items,
  onChange,
  placeholder = 'Add a new entry…',
  max,
  addLabel = 'Add',
  emptyDisallowed = true,
}: Props) {
  const inputId = useId();
  const [draft, setDraft] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateAt = useCallback(
    (index: number, value: string) => {
      const next = items.slice();
      next[index] = value;
      onChange(next);
    },
    [items, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = items.slice();
      next.splice(index, 1);
      onChange(next);
    },
    [items, onChange],
  );

  const swap = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= items.length) return;
      const next = items.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    },
    [items, onChange],
  );

  const addDraft = useCallback(() => {
    const value = draft.trim();
    if (emptyDisallowed && !value) return;
    if (max != null && items.length >= max) return;
    onChange([...items, value]);
    setDraft('');
  }, [draft, items, max, onChange, emptyDisallowed]);

  // Drag handlers
  const onDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox to actually start the drag.
    e.dataTransfer.setData('text/plain', String(index));
  };
  const onDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    swap(dragIndex, dropIndex);
    setDragIndex(null);
  };

  return (
    <div className="rle">
      <ul className="rle__list">
        {items.map((value, i) => (
          <li
            key={`${i}-${value.slice(0, 20)}`}
            className="rle__item"
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
            data-dragging={dragIndex === i || undefined}
          >
            <span className="rle__handle" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
            <input
              type="text"
              className="rle__input admin-field__input"
              value={value}
              onChange={(e) => updateAt(i, e.target.value)}
              aria-label={`Item ${i + 1}`}
            />
            <div className="rle__actions">
              <button
                type="button"
                className="rle__btn"
                onClick={() => swap(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move item ${i + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="rle__btn"
                onClick={() => swap(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`Move item ${i + 1} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className="rle__btn rle__btn--remove"
                onClick={() => removeAt(i)}
                aria-label={`Remove item ${i + 1}`}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="rle__add">
        <label htmlFor={inputId} className="sr-only">
          {addLabel}
        </label>
        <input
          id={inputId}
          type="text"
          className="rle__input admin-field__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={placeholder}
          disabled={max != null && items.length >= max}
        />
        <button
          type="button"
          className="rle__btn rle__btn--add admin-cta admin-cta--primary"
          onClick={addDraft}
          disabled={(emptyDisallowed && !draft.trim()) || (max != null && items.length >= max)}
        >
          + {addLabel}
        </button>
      </div>
    </div>
  );
}
