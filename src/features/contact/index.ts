/**
 * src/features/contact/index.ts
 *
 * Barrel for the Contact feature. Implementation lives at
 * src/components/Contact.tsx. Round 74: removed the `ContactGlbScene`
 * re-export after retiring React Three Fiber entirely; the contact
 * visuals now live in HeimdallMedia + DenDenLuffyMedia (mode-aware).
 */

export { default as Contact } from '../../components/Contact';
export * from '../../services/contact';
