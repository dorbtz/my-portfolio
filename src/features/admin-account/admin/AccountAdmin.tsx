/**
 * src/features/admin-account/admin/AccountAdmin.tsx
 *
 * The admin account-settings page. Three DossierCard sections:
 *
 *   1. Identity        — read-only email pill + editable username
 *   2. Password        — set or change a password (8+ chars, confirm field)
 *   3. Display name    — edits public.profiles.display_name
 *
 * Why username/display_name live here (not on /admin/allowlist):
 *   The Allowlist page manages WHO can sign in (admin emails). This page is
 *   for the SIGNED-IN admin to manage their own profile + credentials. It
 *   uses `useAuth()` for the email and `upsertProfile()` for username +
 *   display_name (server enforces uniqueness on `profiles.username`).
 *
 * Why we don't auto-detect "password set" status:
 *   Supabase hides `auth.users.encrypted_password` from the JS client, so
 *   the client can't tell whether a password exists. Both labels ("Set"
 *   and "Change") are surfaced here unconditionally — but Supabase's
 *   `updateUser({ password })` is idempotent: it sets it the first time
 *   and changes it thereafter, so the same form covers both cases.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminTopBar from '../../admin-dashboard/admin/AdminTopBar';
import AdminPageIcon from '../../admin-dashboard/admin/AdminPageIcon';
import { useMode } from '../../../stores/mode';
import { useAuth } from '../../../hooks/useAuth.helpers';
import { AdminField, AdminInput } from '../../../pages/admin/AdminField';
import { DossierCard } from '../../../pages/admin/DossierCard';
import {
  getProfile,
  upsertProfile,
  isUsernameAvailable,
  changeOwnEmail,
  type Profile,
} from '../../../services/profiles';
import { setOwnPassword, MIN_PASSWORD_LENGTH } from '../../../services/auth';
import { uploadAvatar } from '../../../services/storage';
import '../../admin-dashboard/styles/admin-dashboard.css';

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string };
type AvailState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid'; msg: string };

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,30}$/i;

export default function AccountAdmin() {
  const mode = useMode();
  const isThor = mode === 'thor';
  const { user } = useAuth();

  // Identity / display-name state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [displayDraft, setDisplayDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [identitySave, setIdentitySave] = useState<SaveState>({ kind: 'idle' });
  const [displaySave, setDisplaySave] = useState<SaveState>({ kind: 'idle' });
  const [emailSave, setEmailSave] = useState<SaveState>({ kind: 'idle' });
  const [avatarSave, setAvatarSave] = useState<SaveState>({ kind: 'idle' });
  const [visibilitySave, setVisibilitySave] = useState<SaveState>({ kind: 'idle' });
  // Live username availability — debounced check that hits Supabase to see
  // whether the typed handle is free. Empty drafts and the user's current
  // username both report as 'idle' (no need to check).
  const [usernameAvail, setUsernameAvail] = useState<AvailState>({ kind: 'idle' });
  const availTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwSave, setPwSave] = useState<SaveState>({ kind: 'idle' });

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const p = await getProfile(user.id);
    setProfile(p);
    setUsernameDraft(p?.username ?? '');
    setDisplayDraft(p?.display_name ?? '');
    setEmailDraft(p?.email ?? user.email ?? '');
    setProfileLoaded(true);
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ---------------------------------------------------------------------------
  // Debounced username availability check.
  //
  // Fires ~400ms after the user stops typing. If the field is empty or
  // unchanged from `profile.username`, we don't ping the server — the
  // value is trivially "available" to the same user, and an empty value
  // is the deliberate "no username" choice.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (availTimerRef.current) clearTimeout(availTimerRef.current);
    const trimmed = usernameDraft.trim();
    if (!trimmed) {
      setUsernameAvail({ kind: 'idle' });
      return;
    }
    if (trimmed === (profile?.username ?? '')) {
      setUsernameAvail({ kind: 'idle' });
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameAvail({
        kind: 'invalid',
        msg: '2-31 chars, letters / numbers / _ / - only.',
      });
      return;
    }
    setUsernameAvail({ kind: 'checking' });
    availTimerRef.current = setTimeout(async () => {
      const ok = await isUsernameAvailable(trimmed, user?.id);
      setUsernameAvail({ kind: ok ? 'available' : 'taken' });
    }, 400);
    return () => {
      if (availTimerRef.current) clearTimeout(availTimerRef.current);
    };
  }, [usernameDraft, profile?.username, user?.id]);

  // Initials shown on the nameplate avatar — first letter of the display
  // name, then first letter of the second word if any (e.g. "Dor Ben" → "DB").
  const avatarInitials = useMemo(() => {
    const src = (profile?.display_name || profile?.username || user?.email || '').trim();
    if (!src) return '⚓';
    const parts = src.split(/[\s@_-]+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase() || src[0].toUpperCase();
  }, [profile?.display_name, profile?.username, user?.email]);

  // -------------------------------------------------------------------------
  // Username save (Identity card)
  // -------------------------------------------------------------------------
  async function handleUsernameSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) return;
    const trimmed = usernameDraft.trim();
    if (trimmed && trimmed === (profile?.username ?? '')) {
      setIdentitySave({ kind: 'ok', msg: 'No change.' });
      return;
    }
    setIdentitySave({ kind: 'saving' });
    try {
      const updated = await upsertProfile(user.id, { username: trimmed || null });
      setProfile(updated);
      setIdentitySave({
        kind: 'ok',
        msg: trimmed ? `Username set to "${trimmed}".` : 'Username cleared.',
      });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e?.code === '23505') {
        setIdentitySave({
          kind: 'err',
          msg: 'That username is already taken. Try another.',
        });
      } else {
        setIdentitySave({ kind: 'err', msg: e?.message || 'Could not save username.' });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Display-name save
  // -------------------------------------------------------------------------
  async function handleDisplaySave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) return;
    const trimmed = displayDraft.trim();
    if (trimmed === (profile?.display_name ?? '')) {
      setDisplaySave({ kind: 'ok', msg: 'No change.' });
      return;
    }
    setDisplaySave({ kind: 'saving' });
    try {
      const updated = await upsertProfile(user.id, { displayName: trimmed || null });
      setProfile(updated);
      setDisplaySave({ kind: 'ok', msg: 'Display name updated.' });
    } catch (err) {
      setDisplaySave({
        kind: 'err',
        msg: (err as Error).message || 'Could not save display name.',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Email change — calls supabase.auth.updateUser(...) which sends a
  // confirmation link to BOTH addresses; on success also mirrors the new
  // email into profiles + admin_emails (with old email pushed to history).
  // -------------------------------------------------------------------------
  async function handleEmailSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) return;
    const trimmed = emailDraft.trim().toLowerCase();
    const current = (user.email ?? '').trim().toLowerCase();
    if (trimmed === current) {
      setEmailSave({ kind: 'ok', msg: 'No change.' });
      return;
    }
    setEmailSave({ kind: 'saving' });
    try {
      await changeOwnEmail({ userId: user.id, oldEmail: current, newEmail: trimmed });
      setEmailSave({
        kind: 'ok',
        msg: `Confirmation sent to ${trimmed}. Click the link from that mailbox to finish the change.`,
      });
      // Reload profile so the cached email + crew roster reflect the swap.
      await loadProfile();
    } catch (err) {
      setEmailSave({ kind: 'err', msg: (err as Error).message || 'Could not change email.' });
    }
  }

  // -------------------------------------------------------------------------
  // Avatar upload — pushes file to the public 'avatars' bucket then writes
  // the resulting URL onto profiles.avatar_url.
  // -------------------------------------------------------------------------
  async function handleAvatarFile(file: File) {
    if (!user?.id) return;
    setAvatarSave({ kind: 'saving' });
    try {
      const { url } = await uploadAvatar(file, user.id);
      const updated = await upsertProfile(user.id, { avatarUrl: url });
      setProfile(updated);
      setAvatarSave({ kind: 'ok', msg: 'Profile picture updated.' });
    } catch (err) {
      setAvatarSave({ kind: 'err', msg: (err as Error).message || 'Could not upload avatar.' });
    }
  }

  async function handleAvatarRemove() {
    if (!user?.id) return;
    setAvatarSave({ kind: 'saving' });
    try {
      const updated = await upsertProfile(user.id, { avatarUrl: null });
      setProfile(updated);
      setAvatarSave({ kind: 'ok', msg: 'Profile picture removed.' });
    } catch (err) {
      setAvatarSave({ kind: 'err', msg: (err as Error).message || 'Could not remove avatar.' });
    }
  }

  // -------------------------------------------------------------------------
  // Visibility toggles — single save endpoint that flips the show_* flags
  // on profiles. Each toggle saves individually for instant feedback.
  // -------------------------------------------------------------------------
  async function handleVisibilityToggle(
    field: 'showName' | 'showUsername' | 'showEmail' | 'showAvatar',
    next: boolean,
  ) {
    if (!user?.id) return;
    // Optimistic: update the local profile copy immediately so the
    // checkbox reflects the user's click without flicker.
    const profileKey = ({
      showName: 'show_name',
      showUsername: 'show_username',
      showEmail: 'show_email',
      showAvatar: 'show_avatar',
    } as const)[field];
    setProfile((prev) => (prev ? { ...prev, [profileKey]: next } as Profile : prev));
    setVisibilitySave({ kind: 'saving' });
    try {
      const updated = await upsertProfile(user.id, { [field]: next });
      setProfile(updated);
      setVisibilitySave({ kind: 'ok', msg: 'Saved.' });
    } catch (err) {
      // Rollback optimistic update on failure
      setProfile((prev) => (prev ? { ...prev, [profileKey]: !next } as Profile : prev));
      setVisibilitySave({
        kind: 'err',
        msg: (err as Error).message || 'Could not save visibility.',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Password save
  // -------------------------------------------------------------------------
  async function handlePasswordSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw1.length < MIN_PASSWORD_LENGTH) {
      setPwSave({
        kind: 'err',
        msg: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return;
    }
    if (pw1 !== pw2) {
      setPwSave({ kind: 'err', msg: 'Passwords do not match.' });
      return;
    }
    setPwSave({ kind: 'saving' });
    try {
      await setOwnPassword(pw1);
      setPwSave({
        kind: 'ok',
        msg: 'Password saved. You can now sign in with email + password.',
      });
      setPw1('');
      setPw2('');
      // Once a password is set, hide the dashboard banner.
      try {
        window.localStorage.setItem('admin.pwBanner.dismissed', '1');
      } catch {
        // ignore
      }
    } catch (err) {
      setPwSave({
        kind: 'err',
        msg: (err as Error).message || 'Could not save password.',
      });
    }
  }

  return (
    <div
      className={[
        'admin-shell admin-shell--projects',
        isThor ? 'admin-shell--thor' : 'admin-shell--manga',
      ].join(' ')}
      data-mode-target={mode}
    >
      <div className="admin-page w-full py-6">
        <AdminTopBar />

        <header className="admin-page-header mb-4">
          <p className="admin-card__eyebrow" style={{ marginBottom: '0.15rem' }}>
            {isThor ? '// ACCOUNT' : 'CAPTAIN’S BADGE'}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="account" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', marginBottom: 0, lineHeight: 1.2 }}
            >
              {isThor ? 'Account settings' : 'Captain’s badge'}
            </h1>
          </div>
          <p className="mt-1 text-sm opacity-70 max-w-prose">
            {isThor
              ? 'Set a password, choose a username, edit your display name. Your sign-in email is fixed by the allowlist.'
              : 'Stamp your jolly roger — set a password, pick a handle, write your name on the wanted poster.'}
          </p>
        </header>

        <div className="dossier-cards">
          {/* ---------------------------------------------------------------
            * Identity & Wanted Poster — merged container (Round 34).
            * Holds: live nameplate preview, avatar upload, display name,
            * username (with availability check), email change, and the
            * 4 visibility toggles that drive how each field appears on
            * every public project card.
            * ------------------------------------------------------------- */}
          <DossierCard
            id="account-identity"
            staticOpen
            badge="🪪"
            title={isThor ? 'Identity & wanted poster' : "Captain's nameplate"}
          >
            {/* ---- Live preview row ---- */}
            <div
              className="account-nameplate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.5rem 0 1rem',
                borderBottom: '1px dashed currentColor',
                opacity: 0.92,
              }}
            >
              <div style={{ position: 'relative', flex: '0 0 80px' }}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid currentColor',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      background: isThor
                        ? 'linear-gradient(135deg, #76cfff 0%, #4ccfff 100%)'
                        : 'linear-gradient(135deg, #ffd766 0%, #ffb347 100%)',
                      color: '#04122a',
                      border: '2px solid currentColor',
                    }}
                  >
                    {avatarInitials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {profile?.display_name || (isThor ? '(no display name set)' : '(no captain name set)')}
                </p>
                <p style={{ fontSize: '.78rem', opacity: 0.75, margin: '.15rem 0 0' }}>
                  {profile?.username ? `@${profile.username}` : (isThor ? '(no username set)' : '(no handle set)')}
                </p>
                <p style={{ fontSize: '.7rem', opacity: 0.55, margin: '.15rem 0 0' }}>
                  {profile?.email ?? user?.email}
                </p>
              </div>
            </div>

            {/* ---- Avatar upload row ---- */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="admin-btn"
                disabled={avatarSave.kind === 'saving'}
                onClick={() => avatarInputRef.current?.click()}
                style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}
              >
                {avatarSave.kind === 'saving' ? 'Uploading…' : profile?.avatar_url ? '⬆ Change profile picture' : '⬆ Upload profile picture'}
              </button>
              {profile?.avatar_url && (
                <button
                  type="button"
                  className="admin-btn"
                  disabled={avatarSave.kind === 'saving'}
                  onClick={handleAvatarRemove}
                  style={{ fontSize: '.72rem', padding: '.35rem .65rem' }}
                >
                  Remove
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                  e.target.value = '';
                }}
              />
              {avatarSave.kind === 'ok' && (
                <span className="text-xs" style={{ color: '#4ade80' }} role="status">
                  {avatarSave.msg}
                </span>
              )}
              {avatarSave.kind === 'err' && (
                <span className="text-xs" style={{ color: '#f87171' }} role="alert">
                  {avatarSave.msg}
                </span>
              )}
            </div>

            {/* ---- Display name ---- */}
            <form onSubmit={handleDisplaySave} className="mt-4 grid gap-3">
              <AdminField
                label={isThor ? 'Display name' : 'Name on the poster'}
                hint={
                  isThor
                    ? 'How your name appears in attribution UI (e.g. "Edited by …").'
                    : 'How yer name appears in the crew log.'
                }
                htmlFor="account-display"
              >
                <AdminInput
                  id="account-display"
                  type="text"
                  value={displayDraft}
                  onChange={(e) => setDisplayDraft(e.currentTarget.value)}
                  placeholder={isThor ? 'Dor' : 'Captain Dor'}
                  autoComplete="name"
                  disabled={!profileLoaded || displaySave.kind === 'saving'}
                />
              </AdminField>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="admin-cta admin-cta--primary"
                  disabled={!profileLoaded || displaySave.kind === 'saving'}
                  style={{ padding: '.55rem 1rem' }}
                >
                  {displaySave.kind === 'saving' ? 'Saving…' : 'Save display name'}
                </button>
                {displaySave.kind === 'ok' && (
                  <span className="text-xs" style={{ color: '#4ade80' }} role="status">
                    {displaySave.msg}
                  </span>
                )}
                {displaySave.kind === 'err' && (
                  <span className="text-xs" style={{ color: '#f87171' }} role="alert">
                    {displaySave.msg}
                  </span>
                )}
              </div>
            </form>

            {/* ---- Email change ---- */}
            <form onSubmit={handleEmailSave} className="mt-5 grid gap-3">
              <AdminField
                label="Email"
                hint="Changing this sends a confirmation link to BOTH the old and new addresses. The change finishes when you click the link from your new mailbox."
                htmlFor="account-email"
              >
                <AdminInput
                  id="account-email"
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.currentTarget.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={!profileLoaded || emailSave.kind === 'saving'}
                />
              </AdminField>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  className="admin-cta admin-cta--primary"
                  disabled={!profileLoaded || emailSave.kind === 'saving'}
                  style={{ padding: '.55rem 1rem' }}
                >
                  {emailSave.kind === 'saving' ? 'Sending…' : 'Change email'}
                </button>
                {emailSave.kind === 'ok' && (
                  <span className="text-xs" style={{ color: '#4ade80' }} role="status">
                    {emailSave.msg}
                  </span>
                )}
                {emailSave.kind === 'err' && (
                  <span className="text-xs" style={{ color: '#f87171' }} role="alert">
                    {emailSave.msg}
                  </span>
                )}
              </div>
            </form>

            {/* ---- Username ---- */}
            <form onSubmit={handleUsernameSave} className="mt-5 grid gap-3">
              <AdminField
                label={isThor ? 'Username' : 'Pirate handle'}
                hint={
                  isThor
                    ? 'Optional. Lets you sign in with username + password instead of email.'
                    : 'Optional. Use it instead of an email when ye sign in.'
                }
                htmlFor="account-username"
              >
                <AdminInput
                  id="account-username"
                  type="text"
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.currentTarget.value)}
                  placeholder={isThor ? 'thor' : 'strawhat'}
                  autoComplete="username"
                  disabled={!profileLoaded || identitySave.kind === 'saving'}
                  aria-describedby="account-username-avail"
                />
                {/* Live availability hint — fires after the debounced check. */}
                <p
                  id="account-username-avail"
                  className="text-xs mt-1"
                  role="status"
                  aria-live="polite"
                  style={{
                    minHeight: '1.1rem',
                    color:
                      usernameAvail.kind === 'available' ? '#4ade80'
                      : usernameAvail.kind === 'taken'   ? '#f87171'
                      : usernameAvail.kind === 'invalid' ? '#fbbf24'
                      : 'inherit',
                    opacity:
                      usernameAvail.kind === 'idle' ? 0
                      : usernameAvail.kind === 'checking' ? .7
                      : 1,
                  }}
                >
                  {usernameAvail.kind === 'checking' && 'Checking availability…'}
                  {usernameAvail.kind === 'available' && '✓ Available — yours to claim.'}
                  {usernameAvail.kind === 'taken' && '✗ Taken. Try another handle.'}
                  {usernameAvail.kind === 'invalid' && `✗ ${usernameAvail.msg}`}
                </p>
              </AdminField>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="admin-cta admin-cta--primary"
                  disabled={
                    !profileLoaded ||
                    identitySave.kind === 'saving' ||
                    usernameAvail.kind === 'taken' ||
                    usernameAvail.kind === 'invalid' ||
                    usernameAvail.kind === 'checking'
                  }
                  style={{ padding: '.55rem 1rem' }}
                >
                  {identitySave.kind === 'saving' ? 'Saving…' : 'Save username'}
                </button>
                {identitySave.kind === 'ok' && (
                  <span className="text-xs" style={{ color: '#4ade80' }} role="status">
                    {identitySave.msg}
                  </span>
                )}
                {identitySave.kind === 'err' && (
                  <span className="text-xs" style={{ color: '#f87171' }} role="alert">
                    {identitySave.msg}
                  </span>
                )}
              </div>
            </form>

            {/* ---- Visibility toggles — what shows on each public project card ---- */}
            <div className="mt-6">
              <p className="admin-field__label" style={{ marginBottom: '.4rem' }}>
                {isThor ? 'Show on every project (wanted poster)' : 'Print on every wanted poster'}
              </p>
              <p className="text-xs opacity-65 mb-3">
                {isThor
                  ? 'Pick which of your details get stamped onto each public project card. You can pick any combination — or none.'
                  : 'Choose what to ink on every wanted poster ye publish. Any mix — or none.'}
              </p>
              <div
                style={{
                  display: 'grid',
                  gap: '.55rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                }}
              >
                {([
                  { key: 'showAvatar',   label: 'Profile picture', flag: profile?.show_avatar   ?? true  },
                  { key: 'showName',     label: 'Display name',    flag: profile?.show_name     ?? true  },
                  { key: 'showUsername', label: 'Username',        flag: profile?.show_username ?? true  },
                  { key: 'showEmail',    label: 'Email',           flag: profile?.show_email    ?? false },
                ] as const).map(({ key, label, flag }) => (
                  <label
                    key={key}
                    className="account-vis-toggle"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.55rem',
                      cursor: profileLoaded ? 'pointer' : 'not-allowed',
                      padding: '.5rem .65rem',
                      borderRadius: 8,
                      border: '1px solid currentColor',
                      opacity: profileLoaded ? 1 : 0.5,
                      fontSize: '.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!flag}
                      disabled={!profileLoaded}
                      onChange={(e) => handleVisibilityToggle(key, e.currentTarget.checked)}
                      style={{ width: 18, height: 18, accentColor: 'currentColor' }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {visibilitySave.kind === 'saving' && (
                <p className="text-xs opacity-60 mt-2">Saving…</p>
              )}
              {visibilitySave.kind === 'err' && (
                <p className="text-xs mt-2" style={{ color: '#f87171' }} role="alert">
                  {visibilitySave.msg}
                </p>
              )}
            </div>
          </DossierCard>

          {/* ---------------------------------------------------------------
            * Password — set or change
            * ------------------------------------------------------------- */}
          <DossierCard
            id="account-password"
            staticOpen
            badge="🔐"
            title={isThor ? 'Password' : 'Sea code'}
          >
            <p className="text-sm opacity-75">
              {isThor
                ? `Set or change your password. Minimum ${MIN_PASSWORD_LENGTH} characters. Once set, you can skip the magic link and sign in directly with your email or username.`
                : `Carve yer sea code. At least ${MIN_PASSWORD_LENGTH} characters. With one set, ye can board the ship without waitin’ for a snail call.`}
            </p>
            <form onSubmit={handlePasswordSave} className="grid gap-3 mt-2">
              <AdminField
                label={isThor ? 'New password' : 'New sea code'}
                htmlFor="account-pw1"
              >
                <AdminInput
                  id="account-pw1"
                  type="password"
                  value={pw1}
                  onChange={(e) => setPw1(e.currentTarget.value)}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                  disabled={pwSave.kind === 'saving'}
                />
              </AdminField>
              <AdminField
                label={isThor ? 'Confirm password' : 'Confirm sea code'}
                htmlFor="account-pw2"
              >
                <AdminInput
                  id="account-pw2"
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.currentTarget.value)}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                  disabled={pwSave.kind === 'saving'}
                />
              </AdminField>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="admin-cta admin-cta--primary"
                  disabled={pwSave.kind === 'saving' || pw1.length < MIN_PASSWORD_LENGTH}
                  style={{ padding: '.55rem 1rem' }}
                >
                  {pwSave.kind === 'saving'
                    ? 'Saving…'
                    : isThor
                    ? 'Save password'
                    : 'Carve sea code'}
                </button>
                {pwSave.kind === 'ok' && (
                  <span className="text-xs" style={{ color: '#4ade80' }} role="status">
                    {pwSave.msg}
                  </span>
                )}
                {pwSave.kind === 'err' && (
                  <span className="text-xs" style={{ color: '#f87171' }} role="alert">
                    {pwSave.msg}
                  </span>
                )}
              </div>
            </form>
          </DossierCard>

          {/* (Display Name card removed in Round 34 — merged into Identity above.) */}
        </div>

        {/* Round 33 — small gap so the bottom DossierCard breathes against
             the page footer below. */}
        <div style={{ height: '2.5rem' }} aria-hidden />
      </div>
    </div>
  );
}
