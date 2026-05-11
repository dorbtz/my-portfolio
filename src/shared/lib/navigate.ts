/**
 * src/lib/navigate.ts
 * View Transitions API wrapper around React Router's useNavigate.
 *
 * Usage:
 *   const go = useViewTransitionNav();
 *   go('/projects/my-slug');   // morphs via View Transitions if supported
 */
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

type NavigateWithTransition = (to: string) => void;

/**
 * Returns a navigate function that wraps the route change in
 * `document.startViewTransition()` when the API is available (Chrome 111+).
 * Falls back to a plain navigate() call in browsers that don't support it.
 */
export function useViewTransitionNav(): NavigateWithTransition {
  const navigate = useNavigate();

  return useCallback(
    (to: string) => {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };

      if (typeof doc.startViewTransition === 'function') {
        doc.startViewTransition(() => {
          navigate(to);
        });
      } else {
        navigate(to);
      }
    },
    [navigate],
  );
}
