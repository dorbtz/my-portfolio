/**
 * src/pages/admin/Login.tsx
 *
 * Mode-aware admin sign-in.
 *
 *  - Thor mode  : Asgardian / MCU dossier vibe — dark navy card with electric
 *                 blue label + Mjolnir gold title, glowing Bifrost CTA.
 *  - Luffy mode : Manga / wanted-poster vibe — cream parchment card with
 *                 thick black manga border, brown ink labels, red wanted-bell
 *                 CTA with offset shadow stamp.
 *
 * Two sign-in flows are exposed:
 *
 *   1. Magic link (default, top form) — same as before. Sends an email OTP
 *      via signInWithEmail. Used for first-time onboarding.
 *   2. Email-or-username + password (collapsible "Sign in here ▾" section
 *      below the magic-link form) — for returning admins who set a
 *      password via /admin/account.
 *
 *   - Magic link still pre-checks the allowlist client-side as a UX nicety
 *     before sending an OTP that would never be valid.
 *   - The password form lets the server be the authority: for the email
 *     branch we still pre-check the allowlist; for the username branch the
 *     `lookup_admin_email_by_username` RPC has the allowlist join baked in
 *     (returns NULL for non-admin usernames, so the auth call never even
 *     runs).
 *
 * Both flows redirect to `/admin` (the dashboard hub) on success.
 */
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  signInWithEmail,
  signInWithEmailAndPassword,
  signInWithUsernameAndPassword,
} from "../../services/auth";
import { isEmailAllowed } from "../../services/adminAllowlist";
import { useAuth } from "../../hooks/useAuth.helpers";
import { useMode } from "../../stores/mode";

// Simple email regex — enough to catch typos; the real validation happens
// server-side when Supabase tries to deliver the magic link.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user } = useAuth();
  const mode = useMode();
  const isThor = mode === "thor";

  // Magic-link form state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password form state
  const [showPwd, setShowPwd] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  if (user) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Server-side authority lives in RLS (see migration 0003_admin_allowlist.sql).
      // This client check is purely a UX nicety so non-allowlisted users get a
      // polite error instead of a useless magic link in their inbox.
      const allowed = await isEmailAllowed(trimmed);
      if (!allowed) {
        setError(
          "This email is not authorized for admin access. Contact the site owner.",
        );
        return;
      }
      await signInWithEmail(trimmed);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setSubmitting(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwSubmitting) return;
    setPwError(null);

    const id = identifier.trim();
    if (!id) {
      setPwError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setPwError("Please enter your password.");
      return;
    }

    setPwSubmitting(true);
    try {
      if (id.includes("@")) {
        if (!EMAIL_RE.test(id)) {
          setPwError("That email doesn’t look right.");
          return;
        }
        // Pre-check the allowlist for emails — friendlier than a generic 401.
        const allowed = await isEmailAllowed(id);
        if (!allowed) {
          setPwError(
            "This email is not authorized for admin access. Contact the site owner.",
          );
          return;
        }
        await signInWithEmailAndPassword(id, password);
      } else {
        // Username path — RPC enforces allowlist server-side.
        await signInWithUsernameAndPassword(id, password);
      }
      // useAuth() will flip; the <Navigate> guard above re-renders us out.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed.";
      // Supabase returns "Invalid login credentials" — show that verbatim.
      setPwError(msg);
    } finally {
      setPwSubmitting(false);
    }
  }

  // Microcopy table — keeps JSX free of branching strings.
  const copy = isThor
    ? {
        eyebrow: "// SECURE ACCESS",
        title: "Enter Asgard",
        subtitle:
          "Heimdall guards this gate. Send a Bifrost link to your inbox to cross.",
        emailLabel: "Field comm",
        placeholder: "you@asgard.realm",
        cta: "Send Bifrost link",
        sending: "Opening Bifrost…",
        successHead: "Bifrost link dispatched",
        successBody:
          "Check your inbox for the magic link. Click it to enter the dossier.",
        pwToggle: "Already set a password? Sign in here ▾",
        pwToggleClose: "Use the magic link instead ▴",
        pwIdLabel: "Email or username",
        pwIdPlaceholder: "thor@asgard.realm or thor",
        pwLabel: "Password",
        pwCta: "Sign in",
        pwSending: "Crossing Bifrost…",
      }
    : {
        eyebrow: "WANTED — CREW MEMBER",
        title: "Access Granted",
        subtitle:
          "Only crew can edit the wanted wall. Type your transponder snail address and we'll send a magic link.",
        emailLabel: "Den-Den Mushi address",
        placeholder: "captain@thousand-sunny.sea",
        cta: "Send magic link",
        sending: "Cranking the snail…",
        successHead: "Den-Den's ringing!",
        successBody:
          "We sent a magic link. Tap it from your inbox to set sail into the admin.",
        pwToggle: "Got a sea code? Board here ▾",
        pwToggleClose: "Send a snail call instead ▴",
        pwIdLabel: "Snail address or pirate handle",
        pwIdPlaceholder: "luffy@sunny.sea or strawhat",
        pwLabel: "Sea code",
        pwCta: "Climb aboard",
        pwSending: "Hoisting sails…",
      };

  return (
    <main
      className={[
        "admin-shell admin-shell--login",
        isThor ? "admin-shell--thor" : "admin-shell--manga",
      ].join(" ")}
      data-mode-target={mode}
    >
      <section
        className="admin-card"
        role="region"
        aria-label={isThor ? "Asgardian sign-in" : "Crew sign-in"}
      >
        <p className="admin-card__eyebrow">{copy.eyebrow}</p>
        <h1 className="admin-card__title">{copy.title}</h1>
        <p className="admin-card__subtitle">{copy.subtitle}</p>

        <form onSubmit={onSubmit} className="grid gap-3.5" noValidate>
          <label className="admin-field">
            <span className="admin-field__label">{copy.emailLabel}</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder={copy.placeholder}
              disabled={submitting || sent}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
              className="admin-field__input"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || sent}
            className="admin-cta"
          >
            <span className="admin-cta__label">
              {submitting ? copy.sending : copy.cta}
            </span>
            <span className="admin-cta__glyph" aria-hidden="true">
              {isThor ? "⚡" : "→"}
            </span>
          </button>
        </form>

        {/* Live region so screen readers hear async results */}
        <div className="mt-3 min-h-[1.5rem]" aria-live="polite" aria-atomic="true">
          {sent ? (
            <div className="admin-card__success" role="status">
              <strong>{copy.successHead}</strong>
              <span>{copy.successBody}</span>
            </div>
          ) : null}
          {error ? (
            <p
              id="admin-login-error"
              className="admin-card__error"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        {/* Password form (collapsible) ------------------------------------- */}
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          className="admin-login__pw-toggle"
          aria-expanded={showPwd}
          aria-controls="admin-login-password-form"
        >
          {showPwd ? copy.pwToggleClose : copy.pwToggle}
        </button>

        {showPwd && (
          <form
            id="admin-login-password-form"
            onSubmit={onPasswordSubmit}
            className="grid gap-3.5 mt-3"
            noValidate
          >
            <label className="admin-field">
              <span className="admin-field__label">{copy.pwIdLabel}</span>
              <input
                type="text"
                required
                autoComplete="username"
                spellCheck={false}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (pwError) setPwError(null);
                }}
                placeholder={copy.pwIdPlaceholder}
                disabled={pwSubmitting}
                aria-invalid={Boolean(pwError)}
                className="admin-field__input"
              />
            </label>
            <label className="admin-field">
              <span className="admin-field__label">{copy.pwLabel}</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (pwError) setPwError(null);
                }}
                disabled={pwSubmitting}
                aria-invalid={Boolean(pwError)}
                className="admin-field__input"
              />
            </label>
            <button
              type="submit"
              disabled={pwSubmitting}
              className="admin-cta"
            >
              <span className="admin-cta__label">
                {pwSubmitting ? copy.pwSending : copy.pwCta}
              </span>
              <span className="admin-cta__glyph" aria-hidden="true">
                {isThor ? "⚡" : "→"}
              </span>
            </button>
            {pwError && (
              <p className="admin-card__error" role="alert">
                {pwError}
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
