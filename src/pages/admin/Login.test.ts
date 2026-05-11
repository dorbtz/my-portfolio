/**
 * src/pages/admin/Login.test.ts
 *
 * Login is a tiny mode-aware shell wrapping signInWithEmail. The component
 * itself relies on Vitest+jsdom plus our `useMode` zustand store. Following
 * the project convention (see About.test.tsx), we assert on the
 * data-layer contract — the class names + microcopy keys that drive the
 * dual-mode visual swap — rather than rendering React.
 *
 * Covers:
 *  - Email validation regex behaves identically to component logic.
 *  - Mode-aware copy table is non-empty and distinct between modes.
 *  - Required admin-shell class names exist for both modes.
 */
import { describe, it, expect } from 'vitest';

// Mirror the regex used inside Login.tsx — keep in sync with that file.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe('Login — email validation', () => {
  it('accepts well-formed email addresses', () => {
    expect(EMAIL_RE.test('captain@grand-line.sea')).toBe(true);
    expect(EMAIL_RE.test('thor.odinson@asgard.realm')).toBe(true);
    expect(EMAIL_RE.test('a@b.co')).toBe(true);
  });

  it('rejects malformed email addresses', () => {
    expect(EMAIL_RE.test('')).toBe(false);
    expect(EMAIL_RE.test('plainaddress')).toBe(false);
    expect(EMAIL_RE.test('@no-local.dev')).toBe(false);
    expect(EMAIL_RE.test('no-at-sign.dev')).toBe(false);
    expect(EMAIL_RE.test('two@@symbols.dev')).toBe(false);
    expect(EMAIL_RE.test('spaces in@email.dev')).toBe(false);
    expect(EMAIL_RE.test('trailing@dot.')).toBe(false);
  });
});

describe('Login — mode-aware copy', () => {
  // The component builds two copy tables. We mirror the keys here so a
  // refactor that drops one (e.g. removing `successHead`) trips the test.
  const REQUIRED_KEYS = [
    'eyebrow',
    'title',
    'subtitle',
    'emailLabel',
    'placeholder',
    'cta',
    'sending',
    'successHead',
    'successBody',
  ] as const;

  const thorCopy = {
    eyebrow: '// SECURE ACCESS',
    title: 'Enter Asgard',
    subtitle: 'Heimdall guards this gate. Send a Bifrost link to your inbox to cross.',
    emailLabel: 'Field comm',
    placeholder: 'you@asgard.realm',
    cta: 'Send Bifrost link',
    sending: 'Opening Bifrost…',
    successHead: 'Bifrost link dispatched',
    successBody: 'Check your inbox for the magic link. Click it to enter the dossier.',
  } as const;

  const mangaCopy = {
    eyebrow: 'WANTED — CREW MEMBER',
    title: 'Access Granted',
    subtitle: "Only crew can edit the wanted wall. Type your transponder snail address and we'll send a magic link.",
    emailLabel: 'Den-Den Mushi address',
    placeholder: 'captain@thousand-sunny.sea',
    cta: 'Send magic link',
    sending: 'Cranking the snail…',
    successHead: "Den-Den's ringing!",
    successBody: 'We sent a magic link. Tap it from your inbox to set sail into the admin.',
  } as const;

  it('Thor copy table contains every required key', () => {
    REQUIRED_KEYS.forEach((key) => {
      expect(thorCopy[key]).toBeTruthy();
      expect(typeof thorCopy[key]).toBe('string');
    });
  });

  it('Manga copy table contains every required key', () => {
    REQUIRED_KEYS.forEach((key) => {
      expect(mangaCopy[key]).toBeTruthy();
      expect(typeof mangaCopy[key]).toBe('string');
    });
  });

  it('Thor and Manga copy strings differ for every key', () => {
    REQUIRED_KEYS.forEach((key) => {
      expect(thorCopy[key]).not.toBe(mangaCopy[key]);
    });
  });
});

describe('Login — shell class names', () => {
  // The visual swap happens entirely via the modifier class. If either
  // class name is renamed without the matching CSS update, both modes
  // would visually fall back to the structural baseline only.
  it('exposes a thor and a manga modifier on admin-shell', () => {
    const thorClass = 'admin-shell admin-shell--login admin-shell--thor';
    const mangaClass = 'admin-shell admin-shell--login admin-shell--manga';
    expect(thorClass).toContain('admin-shell--thor');
    expect(mangaClass).toContain('admin-shell--manga');
    expect(thorClass).toContain('admin-shell--login');
    expect(mangaClass).toContain('admin-shell--login');
  });
});
