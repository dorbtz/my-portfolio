/**
 * src/features/auth/index.ts
 *
 * Barrel exports for the auth feature. Targets the migration in
 * docs/ARCHITECTURE.md — once the underlying files have been moved
 * under `features/auth/{components,hooks,services}`, callers can update
 * their imports to come from this barrel without further code change.
 *
 * Today, the implementations still live at:
 *   - src/components/AdminRoute.tsx
 *   - src/hooks/useAuth.tsx
 *   - src/services/auth.ts
 *   - src/services/adminAllowlist.ts
 */

export { default as AdminRoute } from '../../components/AdminRoute';
export { AuthProvider } from '../../hooks/useAuth';
export { useAuth } from '../../hooks/useAuth.helpers';
export type { AuthState } from '../../hooks/useAuth.helpers';
export * from '../../services/auth';
export * from '../../services/adminAllowlist';
