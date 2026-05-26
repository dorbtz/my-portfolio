/**
 * src/components/Contact.tsx
 *
 * Round 20 — pivoted from <model-viewer> to React Three Fiber for the 3D
 * card. The previous baseColor injection patch never reliably colored the
 * textureless GLBs in production (user confirmed "the GLB doesn't work at
 * all"). R3F gives us explicit material control via a small dedicated
 * scene component (ContactGlbScene). The GLB sources are unchanged:
 *   - Thor mode  : /assets/Marvel/heimdall.glb        (~980 KB)
 *   - Luffy mode : /assets/One-Piece/dendendonflamingo.opt.glb (~2.3 MB)
 *
 * Round 13 history — viewport-trigger replaces the previous click-gate so
 * both modes auto-load their GLB once Contact scrolls into view; static-
 * poster fallback for low-tier devices remains in place.
 *
 * Original rewrite notes (May 2026):
 *
 *   The previous Contact (~970 LOC) had form-field overflow, a 586 MB GLB
 *   click-to-load gate, inline <style> tags, and two drift-prone Thor/
 *   Luffy frame components. The current implementation is ~250 LOC, all
 *   CSS in `index.css` under `.contact-v2*`, and uses CSS Grid with
 *   `min-width: 0` on every cell so inputs physically can't overflow.
 */

import { lazy, Suspense, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Section from '../../shared/ui/Section';
import { useMode } from '../../shared/stores/mode';
import { sendContactMessage } from './services/contact';
import {
  NAME_TOO_SHORT_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  MESSAGE_TOO_SHORT_MESSAGE,
} from './services/contact-errors';
import { useSiteContent } from '../content/hooks/useSiteContent';

// Round 27: Luffy mode replaces the Donflamingo GLB with a PNG/MP4 swap.
// Round 65: Thor mode follows suit with a static Heimdall PNG + WEBM
// overlay that animates on submit (mirrors DenDenLuffyMedia).  Both
// branches are lazy-loaded so the unused mode never enters the bundle.
// The R3F GLB scene + capability-tier static fallback are gone — the
// new media pipeline is light enough to render on every device.
const DenDenLuffyMedia = lazy(() => import('./DenDenLuffyMedia'));
const HeimdallMedia = lazy(() => import('./HeimdallMedia'));

// ---------------------------------------------------------------------------
// Mode-aware copy
// ---------------------------------------------------------------------------
const COPY = {
  thor: {
    eyebrow: 'Bifrost direct line',
    title: 'Send Word to Asgard',
    sub: 'Heimdall sees all. Drop a message — I\'ll answer before the storm rolls in.',
    nameLabel: 'Your name',
    namePlaceholder: 'Wanderer of the realms',
    emailLabel: 'Your email',
    emailPlaceholder: 'midgard@example.com',
    messageLabel: 'Your message',
    messagePlaceholder: 'What does the realm need today?',
    submit: 'Open the Bifrost',
    sending: 'Opening Bifrost…',
    success: 'Message reached Asgard. Heimdall has eyes on it.',
    modelAlt: 'Heimdall — guardian of the Bifrost',
    modelCaption: 'Heimdall · The All-Seeing',
  },
  gear5: {
    eyebrow: 'Den Den Mushi line',
    title: 'Call the Captain',
    sub: 'Pick up the snail. Drop a message — answered between heists across the Grand Line.',
    nameLabel: 'Your name',
    namePlaceholder: 'Pirate alias',
    emailLabel: 'Your email',
    emailPlaceholder: 'crew@grand-line.example',
    messageLabel: 'Your message',
    messagePlaceholder: 'Spill the bounty…',
    submit: 'Send the transmission',
    sending: 'Pururururu…',
    success: 'Message received. Captain will get back to you.',
    modelAlt: 'Den Den Luffy Gear 5 — animated messenger snail',
    modelCaption: 'Den Den Luffy Gear 5',
  },
} as const;

// ---------------------------------------------------------------------------
// Mode-aware media card — both modes use a static PNG backdrop + a
// transparent WEBM overlay that plays on submit.  Luffy = Den Den Mushi
// snail; Thor = Heimdall (Round 65).  No GLB, no R3F, no capability gate.
// ---------------------------------------------------------------------------
function ContactModel({
  mode,
  videoPlaying,
  onVideoEnded,
  imageUrlOverride,
  videoUrlOverride,
}: {
  mode: 'thor' | 'gear5';
  /** Drives the WEBM overlay's play/pause on submit. */
  videoPlaying: boolean;
  onVideoEnded: () => void;
  /** Round 34 — admin-uploaded media URLs from site_content. */
  imageUrlOverride?: string;
  videoUrlOverride?: string;
}) {
  if (mode === 'gear5') {
    return (
      <Suspense fallback={<div className="contact-v2__model-fallback">Pururururu…</div>}>
        <DenDenLuffyMedia
          playing={videoPlaying}
          onEnded={onVideoEnded}
          alt={COPY.gear5.modelAlt}
          imageUrlOverride={imageUrlOverride}
          videoUrlOverride={videoUrlOverride}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="contact-v2__model-fallback">Opening Bifrost…</div>}>
      <HeimdallMedia
        playing={videoPlaying}
        onEnded={onVideoEnded}
        alt={COPY.thor.modelAlt}
        imageUrlOverride={imageUrlOverride}
        videoUrlOverride={videoUrlOverride}
      />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Main Contact section
// ---------------------------------------------------------------------------
type Status = 'idle' | 'sending' | 'success' | 'error';

export default function Contact() {
  const mode = useMode();
  const cmsCopy = useSiteContent('contact');
  // Layered: CMS → mode-specific COPY constants (the existing fallback). Every
  // field is `string` so we coerce defensively. The const COPY object stays
  // exported as the synchronous fallback per the round 13 contract.
  const fallback = COPY[mode];
  const copy = useMemo(() => {
    const out: Record<keyof typeof fallback, string> = { ...fallback };
    for (const key of Object.keys(fallback) as (keyof typeof fallback)[]) {
      const cmsValue = cmsCopy[key as string];
      if (typeof cmsValue === 'string' && cmsValue.length) out[key] = cmsValue;
    }
    return out;
  }, [cmsCopy, fallback]);
  const formId = useId();

  // Round 65: GLB pipeline removed; both modes now use a tiny image+webm
  // pair that loads cheaply on every device, so the previous viewport-
  // trigger machinery (modelInView + IntersectionObserver) is gone.  The
  // media card is rendered immediately and the lazy() chunk loads on
  // first paint of the section.

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Round 27: Luffy-only — flips true when the user submits, flips back
  // false on the video's `onEnded` event so the PNG returns.
  const [videoPlaying, setVideoPlaying] = useState(false);

  /**
   * Round 55 — validate on submit (no longer disables the button).
   * Returns the friendly error string for the first failing field, or
   * `null` if the payload would pass the server-side CHECK constraints
   * on the `messages` table:
   *   name        char_length(name) >= 1
   *   email       email ~* '^[^@]+@[^@]+\.[^@]+$'
   *   message     char_length(message) >= 10
   * (See supabase/migrations/0007_messages_table.sql.)
   */
  function validate(): string | null {
    if (!name.trim()) return NAME_TOO_SHORT_MESSAGE;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return EMAIL_INVALID_MESSAGE;
    if (message.trim().length < 10) return MESSAGE_TOO_SHORT_MESSAGE;
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;

    // Pre-flight validation — show the friendly per-field message
    // instead of firing a request the server will reject.
    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setStatus('sending');
    setErrorMsg(null);
    // Round 27: kick off the Den Den Mushi video on submit (Luffy mode).
    // Round 67: Thor mode now also plays its overlay (heimdall3.webm) on
    // submit — same one-shot animation pattern, just a different asset.
    setVideoPlaying(true);
    try {
      await sendContactMessage({ name, email, message });
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Send failed. Try again.');
    }
  }

  return (
    <Section id="contact" label="Contact">
      <div className={`contact-v2 contact-v2--${mode}`} data-testid="contact-v2">
        <header className="contact-v2__hero">
          <span className="contact-v2__eyebrow">{copy.eyebrow}</span>
          <h2 className="contact-v2__title">{copy.title}</h2>
          <p className="contact-v2__sub">{copy.sub}</p>
        </header>

        <div className="contact-v2__grid">
          <aside className="contact-v2__model" aria-label={copy.modelAlt}>
            <div className="contact-v2__model-frame">
              <ContactModel
                mode={mode}
                videoPlaying={videoPlaying}
                onVideoEnded={() => setVideoPlaying(false)}
                imageUrlOverride={
                  typeof cmsCopy.modelImageUrl === 'string'
                    ? (cmsCopy.modelImageUrl as string)
                    : undefined
                }
                videoUrlOverride={
                  typeof cmsCopy.modelVideoUrl === 'string'
                    ? (cmsCopy.modelVideoUrl as string)
                    : undefined
                }
              />
            </div>
            <p className="contact-v2__model-caption">{copy.modelCaption}</p>
          </aside>

          <form className="contact-v2__form" onSubmit={onSubmit} noValidate>
            <div className="contact-v2__field">
              <label className="contact-v2__label" htmlFor={`${formId}-name`}>
                {copy.nameLabel}
              </label>
              <input
                id={`${formId}-name`}
                className="contact-v2__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={copy.namePlaceholder}
                autoComplete="name"
                required
                disabled={status === 'sending'}
              />
            </div>

            <div className="contact-v2__field">
              <label className="contact-v2__label" htmlFor={`${formId}-email`}>
                {copy.emailLabel}
              </label>
              <input
                id={`${formId}-email`}
                className="contact-v2__input"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
                required
                disabled={status === 'sending'}
              />
            </div>

            <div className="contact-v2__field contact-v2__field--full">
              <label className="contact-v2__label" htmlFor={`${formId}-message`}>
                {copy.messageLabel}
              </label>
              <textarea
                id={`${formId}-message`}
                className="contact-v2__textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={copy.messagePlaceholder}
                rows={5}
                required
                disabled={status === 'sending'}
              />
            </div>

            <div className="contact-v2__actions">
              <button
                type="submit"
                className="contact-v2__submit"
                disabled={status === 'sending'}
                aria-busy={status === 'sending'}
              >
                {status === 'sending' ? copy.sending : copy.submit}
              </button>
            </div>

            <div className="contact-v2__status" role="status" aria-live="polite">
              {status === 'success' && (
                <p className="contact-v2__success">{copy.success}</p>
              )}
              {status === 'error' && errorMsg && (
                <p className="contact-v2__error">{errorMsg}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}
