/**
 * src/core/index.ts
 *
 * Cross-cutting concerns barrel. Per docs/ARCHITECTURE.md, the underlying
 * files will eventually be moved into:
 *   - src/core/components/  (Header, Footer, Section, Cursor, BifrostLoader, ...)
 *   - src/core/hooks/       (useCapability, useFocusTrap, useGithubBadge, ...)
 *   - src/core/lib/integrations/  (supabase, audio, lenis, gsap)
 *   - src/core/lib/utils/   (tooltipPosition, projectDefaultCover, ...)
 *   - src/core/stores/      (mode store)
 *   - src/core/providers/   (SmoothScrollProvider)
 */

export { default as Header } from '../components/Header';
export { default as Footer } from '../components/Footer';
export { default as Section } from '../components/Section';
export { default as SectionDivider } from '../components/SectionDivider';
export { useMode, useMotionOn, useEffectsActive, useModeStore } from '../stores/mode';
export { useCapability } from '../hooks/useCapability';
export { supabase } from '../lib/supabase';
