/**
 * src/components/ScrollToTop.tsx
 *
 * Round 20 helper — listens for react-router pathname changes and scrolls
 * the window back to (0, 0) instantly. Mounted ONCE inside <Routes> so
 * every route transition (e.g. clicking an admin dashboard card) lands the
 * user at the TOP of the destination page, not the middle.
 *
 * Hash navigations (#section) are intentionally left alone — those mean
 * "scroll to a specific anchor", not "go to top".
 *
 * Pure side-effect component: returns null.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Hash-based deep links handle their own scroll (browser default or
    // an explicit element.scrollIntoView() call elsewhere).
    if (hash) return;
    // Use 'instant' behaviour so route transitions feel snappy. The
    // smooth-scroll library (Lenis) on the public site only animates
    // intra-page scroll — cross-route jumps should be discrete.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
