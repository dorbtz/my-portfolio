/**
 * src/features/content/admin/ContactContentAdmin.tsx
 *
 * Round 30 — Mode-split edit. Reads the active mode via `useMode()` and
 * renders ONLY that mode's Contact draft. Switching modes in the global
 * toggle reloads this page focused on the other mode.
 *
 * Round 29 (kept) — renders the live Contact section's hero + form layout
 * with `<InlineEdit>` wrappers. Reuses the live `.contact-v2__*` CSS
 * classes so the visual fidelity stays tight without extra styles.
 */

import { useRef, useState } from 'react';
import ContentAdminShell from './ContentAdminShell';
import { useContentEditor } from './useContentEditor';
import { SaveBar } from './HeroContentAdmin';
import InlineEdit from './InlineEdit';
import { useMode } from '../../../shared/stores/mode';
import type { SiteMode } from '../types';
import { uploadContactMedia } from '../../projects/services/storage';

// ---------------------------------------------------------------------------
// Default media — bundled assets used as a fallback when no admin upload
// has been recorded for that mode. Mirrored in `Contact.tsx` so the live
// site stays in sync with what the admin sees in the preview.
// ---------------------------------------------------------------------------
const CONTACT_MODEL_DEFAULTS: Record<SiteMode, { image: string; video: string | null }> = {
  thor: {
    image: '/assets/Marvel/heimdall/heimdall.png',
    video: '/assets/Marvel/heimdall/heimdall.webm',
  },
  gear5: {
    image: '/assets/One-Piece/Den-Den-Mushi-One-Piece.webp',
    video: null,
  },
};

type Bind = (field: string) => { value: string; onSave: (next: string) => Promise<void> };

// ---------------------------------------------------------------------------
// Contact model editor — left column of the contact preview grid.
// Renders the live model frame with the configured image + video, plus
// two upload dropzones (PNG backdrop + WEBM animation) that persist URLs
// to the contact site_content draft.
// ---------------------------------------------------------------------------
function ContactModelEditor({
  mode,
  draft,
  onSaveField,
  bind,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
  bind: Bind;
}) {
  const defaults = CONTACT_MODEL_DEFAULTS[mode];
  const customImage =
    typeof draft.modelImageUrl === 'string' && draft.modelImageUrl.trim()
      ? (draft.modelImageUrl as string)
      : '';
  const customVideo =
    typeof draft.modelVideoUrl === 'string' && draft.modelVideoUrl.trim()
      ? (draft.modelVideoUrl as string)
      : '';
  const imageSrc = customImage || defaults.image;
  const videoSrc = customVideo || defaults.video || '';

  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'image' | 'video' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File, kind: 'image' | 'video') {
    setBusy(kind);
    setError(null);
    try {
      const { url } = await uploadContactMedia(file, kind);
      const field = kind === 'image' ? 'modelImageUrl' : 'modelVideoUrl';
      await onSaveField(field, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleClear(kind: 'image' | 'video') {
    const field = kind === 'image' ? 'modelImageUrl' : 'modelVideoUrl';
    try {
      await onSaveField(field, '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    }
  }

  return (
    <aside className="contact-v2__model">
      {/* Live model frame — same visual as the public Contact section. */}
      <div
        className="contact-v2__model-frame"
        style={{
          position: 'relative',
          minHeight: 260,
          overflow: 'hidden',
          borderRadius: 18,
          background: mode === 'thor'
            ? 'radial-gradient(ellipse at 50% 35%, rgba(76,207,255,0.20), rgba(7,16,30,0.95) 70%)'
            : 'radial-gradient(ellipse at 50% 35%, rgba(255,200,140,0.30), rgba(50,20,10,0.92) 70%)',
        }}
        aria-hidden="true"
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: mode === 'thor' ? 'cover' : 'contain',
              objectPosition: mode === 'thor' ? 'center 35%' : 'center',
              padding: mode === 'thor' ? 0 : '1.5rem',
            }}
          />
        )}
        {videoSrc && (
          <video
            key={videoSrc /* re-mount when URL changes so the new file plays */}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            fontSize: '.6rem',
            letterSpacing: '.18em',
            fontWeight: 800,
            padding: '.18rem .5rem',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            pointerEvents: 'none',
          }}
        >
          LIVE PREVIEW
        </span>
      </div>

      {/* ----- Upload controls ----- */}
      <div style={{ display: 'grid', gap: '.6rem', marginTop: '.85rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="admin-btn"
            disabled={busy !== null}
            onClick={() => imgInput.current?.click()}
            style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}
          >
            {busy === 'image' ? 'Uploading…' : '⬆ Upload PNG backdrop'}
          </button>
          {customImage && (
            <button
              type="button"
              className="admin-btn"
              onClick={() => handleClear('image')}
              style={{ fontSize: '.72rem', padding: '.35rem .65rem' }}
            >
              Reset to default
            </button>
          )}
          <span style={{ fontSize: '.7rem', opacity: 0.65 }}>
            {customImage ? 'Custom image active' : 'Using default image'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="admin-btn"
            disabled={busy !== null}
            onClick={() => vidInput.current?.click()}
            style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}
          >
            {busy === 'video' ? 'Uploading…' : '⬆ Upload WEBM animation'}
          </button>
          {customVideo && (
            <button
              type="button"
              className="admin-btn"
              onClick={() => handleClear('video')}
              style={{ fontSize: '.72rem', padding: '.35rem .65rem' }}
            >
              Reset to default
            </button>
          )}
          <span style={{ fontSize: '.7rem', opacity: 0.65 }}>
            {customVideo
              ? 'Custom video active'
              : defaults.video
                ? 'Using default video'
                : 'No video for this mode'}
          </span>
        </div>
        {error && (
          <p className="text-xs" role="alert" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}
        <p className="text-[11px] opacity-55" style={{ lineHeight: 1.4 }}>
          PNG ≤ 4 MB · WEBM ≤ 12 MB. Each upload replaces the active media for
          this mode (only one PNG and one WEBM are kept per mode).
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imgInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={vidInput}
        type="file"
        accept="video/webm,video/mp4"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file, 'video');
          e.target.value = '';
        }}
      />

      {/* Alt + caption editors */}
      <p className="text-xs opacity-65 mt-3">
        Alt text:{' '}
        <InlineEdit {...bind('modelAlt')} ariaLabel="Model alt text">
          {(v) => <span>{v}</span>}
        </InlineEdit>
      </p>
      <p className="contact-v2__model-caption mt-1">
        <InlineEdit {...bind('modelCaption')} ariaLabel="Model caption">
          {(v) => <span>{v}</span>}
        </InlineEdit>
      </p>
    </aside>
  );
}

function ContactPreview({
  mode,
  draft,
  onSaveField,
}: {
  mode: SiteMode;
  draft: Record<string, unknown>;
  onSaveField: (field: string, value: unknown) => Promise<void>;
}) {
  const bind = (field: string) => ({
    value: String(draft[field] ?? ''),
    onSave: (next: string) => onSaveField(field, next),
  });

  return (
    <div className={`content-preview contact-v2 contact-v2--${mode}`}>
      <span className="content-preview__legend">
        Contact · {mode === 'thor' ? 'Thor' : 'Gear 5'} preview
      </span>

      {/* Hero copy — eyebrow, title, sub */}
      <header className="contact-v2__hero">
        <span className="contact-v2__eyebrow">
          <InlineEdit {...bind('eyebrow')} ariaLabel="Eyebrow">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </span>
        <h2 className="contact-v2__title">
          <InlineEdit {...bind('title')} ariaLabel="Section title">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </h2>
        <p className="contact-v2__sub">
          <InlineEdit multiline {...bind('sub')} ariaLabel="Subtitle">
            {(v) => <span>{v}</span>}
          </InlineEdit>
        </p>
      </header>

      {/* Form preview — full visual fidelity but inputs are decorative
          (they show the placeholder text but aren't usable).

          Round 34: model card backdrop + animation are now uploadable
          via two separate dropzones. Saved URLs live in
          site_content.contact[mode].modelImageUrl / modelVideoUrl.
          The live `<Contact>` component falls back to the bundled
          /assets defaults when these fields are empty. */}
      <div className="contact-v2__grid">
        <ContactModelEditor mode={mode} draft={draft} onSaveField={onSaveField} bind={bind} />

        <div className="contact-v2__form">
          <div className="contact-v2__field">
            <label className="contact-v2__label">
              <InlineEdit {...bind('nameLabel')} ariaLabel="Name label">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </label>
            <input
              type="text"
              className="contact-v2__input"
              readOnly
              tabIndex={-1}
              placeholder={String(draft.namePlaceholder ?? '')}
              aria-hidden="true"
            />
            <p className="text-xs opacity-60 mt-1">
              Placeholder:{' '}
              <InlineEdit {...bind('namePlaceholder')} ariaLabel="Name placeholder">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>

          <div className="contact-v2__field">
            <label className="contact-v2__label">
              <InlineEdit {...bind('emailLabel')} ariaLabel="Email label">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </label>
            <input
              type="email"
              className="contact-v2__input"
              readOnly
              tabIndex={-1}
              placeholder={String(draft.emailPlaceholder ?? '')}
              aria-hidden="true"
            />
            <p className="text-xs opacity-60 mt-1">
              Placeholder:{' '}
              <InlineEdit {...bind('emailPlaceholder')} ariaLabel="Email placeholder">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>

          <div className="contact-v2__field contact-v2__field--full">
            <label className="contact-v2__label">
              <InlineEdit {...bind('messageLabel')} ariaLabel="Message label">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </label>
            <textarea
              className="contact-v2__textarea"
              readOnly
              tabIndex={-1}
              rows={3}
              placeholder={String(draft.messagePlaceholder ?? '')}
              aria-hidden="true"
            />
            <p className="text-xs opacity-60 mt-1">
              Placeholder:{' '}
              <InlineEdit multiline {...bind('messagePlaceholder')} ariaLabel="Message placeholder">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>

          <div className="contact-v2__actions">
            <button type="button" className="contact-v2__submit" disabled>
              <InlineEdit {...bind('submit')} ariaLabel="Submit button label">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </button>
          </div>

          {/* Inline statuses — show all 3 states stacked so admins can
              edit each one without clicking through. */}
          <div className="contact-v2__status">
            <p className="text-xs opacity-70 mb-1">Sending status text:</p>
            <p className="text-sm font-medium">
              <InlineEdit {...bind('sending')} ariaLabel="Sending text">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
            <p className="text-xs opacity-70 mt-3 mb-1">Success message:</p>
            <p className="contact-v2__success">
              <InlineEdit multiline {...bind('success')} ariaLabel="Success message">
                {(v) => <span>{v}</span>}
              </InlineEdit>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactContentAdmin() {
  const editor = useContentEditor('contact');
  const mode = useMode();
  const isThor = mode === 'thor';
  return (
    <ContentAdminShell
      eyebrow={isThor ? '// CONTACT' : '// DEN DEN MUSHI'}
      title={isThor ? 'Contact' : 'Den Den greeting'}
      section="content-contact"
      description={
        isThor
          ? 'Click any text in the form preview to edit. Changes save on blur.'
          : 'Click any line on the snail-line panel to set the greeting. Changes save on blur. Flip to Thor mode in the global toggle to edit Asgard’s comms.'
      }
      feedback={<SaveBar editor={editor} />}
    >
      <ContactPreview
        mode={mode}
        draft={isThor ? editor.thor : editor.gear5}
        onSaveField={(field, value) => editor.saveField(mode, field, value)}
      />
    </ContentAdminShell>
  );
}
