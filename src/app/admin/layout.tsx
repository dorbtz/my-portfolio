import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser, isAllowlistedAdmin } from "@/shared/lib/auth/server";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { SignOutButton } from "./SignOutButton";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin shell — wraps every /admin/** route except /admin/login itself.
 * Renders a glass sidebar nav + main content slot. Middleware already
 * gated the route; layout only fetches the user for the signed-in chrome.
 * Nav is rendered by the AdminNav Client Component so per-theme icons
 * swap LIVE on theme toggle (no refresh needed).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, { theme }] = await Promise.all([
    getSessionUser(),
    readThemeState(),
  ]);
  const signedIn = Boolean(user && (await isAllowlistedAdmin(user.email)));

  return (
    // dir="ltr" pins the entire admin shell (top bar, sidebar nav, cards)
    // to LTR layout regardless of locale — admin chrome stays put even when
    // the public site is in HE/RTL. Text inside still renders Hebrew
    // correctly because short labels work fine inside an LTR container.
    <div className="min-h-dvh" dir="ltr">
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto pt-6 pb-16">
        {/* Back-to-site bar — admin has no public Header, this gives a one-click
            exit. 3-column grid: back-link left, email center, empty right spacer
            so the floating ThemeSwitcher / LangSwitcher cluster (fixed top-right
            on the viewport) doesn't overlap the email. Email hides below `lg`
            because that's the breakpoint where the floating cluster fits beside it. */}
        <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm text-fg hover:text-accent transition-colors justify-self-start"
            aria-label="Back to dorbtz.com"
          >
            <span aria-hidden>←</span>
            <span className="font-semibold tracking-tight">
              dor<span className="text-accent">b</span>tz
            </span>
            <span className="text-muted hidden sm:inline">· back to site</span>
          </Link>
          {signedIn && user ? (
            <span
              className="text-caption text-muted text-center truncate justify-self-center hidden lg:inline"
              title={user.email}
            >
              {user.email}
            </span>
          ) : (
            <span />
          )}
          {/* Reserved space matching the floating cluster's footprint so the
              centered email visually balances. ~360px is the cluster's max width
              at desktop with both ThemeSwitcher (~220px) + LangSwitcher (~100px). */}
          <span aria-hidden className="justify-self-end hidden lg:inline-block w-[360px]" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <AdminNav initialTheme={theme} />
            {signedIn && user && (
              <div className="glass rounded-lg p-3 mt-3 hidden lg:block">
                <p className="text-caption text-muted">Signed in as</p>
                <p className="text-body-sm font-medium text-fg truncate">{user.email}</p>
                <div className="mt-3">
                  <SignOutButton />
                </div>
              </div>
            )}
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}
