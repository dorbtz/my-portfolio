/**
 * src/hooks/useFocusTrap.ts
 * Traps keyboard focus inside a container element while active.
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen, onClose, triggerRef?);
 *   <aside ref={trapRef as React.Ref<HTMLElement>} role="dialog" aria-modal="true"> ... </aside>
 *
 * When active (isOpen === true):
 *   - Sets focus to the first focusable element in the container.
 *   - Tab / Shift+Tab cycle only within focusable descendants.
 *   - Escape calls the provided onClose callback.
 * When deactivated, focus returns to triggerRef.current (if provided).
 */
import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(
  active: boolean,
  onClose: () => void,
  triggerRef?: React.RefObject<HTMLElement | null>
): React.RefObject<HTMLElement | null> {
  const containerRef = useRef<HTMLElement | null>(null);

  const getFocusables = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
  }, []);

  useEffect(() => {
    if (!active) {
      // Restore focus to the trigger that opened the drawer
      triggerRef?.current?.focus();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element immediately
    const elements = getFocusables();
    elements[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      const els = getFocusables();
      const firstEl = els[0];
      const lastEl = els[els.length - 1];

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && firstEl && lastEl) {
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active, onClose, getFocusables, triggerRef]);

  return containerRef as React.RefObject<HTMLElement | null>;
}
