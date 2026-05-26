import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser, isAllowlistedAdmin } from "@/shared/lib/auth/server";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

type NavItem = {
  label: string;
  href: string;
  /** Per-theme glyph: which icon file to use under the active theme. */
  thorIcon: string;
  luffyIcon: string;
};

/**
 * Admin nav with per-theme decorative icons.
 *  - HighTech: no icon (clean minimal default)
 *  - Thor:     Marvel icons from public/assets/Marvel/icons/
 *  - Luffy:    One-Piece icons from public/assets/One-Piece/icons/
 */
const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    thorIcon: "/assets/Marvel/icons/mjolnir.ico",
    luffyIcon: "/assets/One-Piece/icons/strawhatflag.ico",
  },
  {
    label: "Content",
    href: "/admin/content",
    thorIcon: "/assets/Marvel/icons/captain-shield.ico",
    luffyIcon: "/assets/One-Piece/icons/luffy.ico",
  },
  {
    label: "Messages",
    href: "/admin/messages",
    thorIcon: "/assets/Marvel/icons/spiderman.ico",
    luffyIcon: "/assets/One-Piece/icons/strawhatflag.ico",
  },
  {
    label: "Health",
    href: "/admin/health",
    thorIcon: "/assets/Marvel/icons/ironman.ico",
    luffyIcon: "/assets/One-Piece/icons/luffy.ico",
  },
  {
    label: "MCP tools",
    href: "/admin/mcp",
    thorIcon: "/assets/Marvel/icons/stan-lee.ico",
    luffyIcon: "/assets/One-Piece/icons/strawhatflag.ico",
  },
  {
    label: "Account",
    href: "/admin/account",
    thorIcon: "/assets/Marvel/icons/blackpanther.ico",
    luffyIcon: "/assets/One-Piece/icons/luffy.ico",
  },
];

/**
 * Admin shell — wraps every /admin/** route except /admin/login itself.
 * Renders a glass sidebar nav + main content slot. Middleware already
 * gated the route; layout only fetches the user for the signed-in chrome.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, { theme }] = await Promise.all([
    getSessionUser(),
    readThemeState(),
  ]);
  const signedIn = Boolean(user && (await isAllowlistedAdmin(user.email)));
  const themeIcon = (item: NavItem) =>
    theme === "thor" ? item.thorIcon : theme === "luffy" ? item.luffyIcon : null;

  return (
    <div className="min-h-dvh">
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto pt-6 pb-16">
        {/* Back-to-site bar — admin has no public Header, this gives a one-click exit */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm text-fg hover:text-accent transition-colors"
            aria-label="Back to dorbtz.com"
          >
            <span aria-hidden>←</span>
            <span className="font-semibold tracking-tight">
              dor<span className="text-accent">b</span>tz
            </span>
            <span className="text-muted">· back to site</span>
          </Link>
          {signedIn && user && (
            <span className="text-caption text-muted hidden sm:inline">
              {user.email}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav
              aria-label="Admin sections"
              className="admin-nav glass rounded-lg p-2 flex lg:flex-col gap-1 flex-wrap"
            >
              {NAV.map((item) => {
                const icon = themeIcon(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="admin-nav__item px-3 py-2 rounded-md text-body-sm font-medium text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] transition-colors flex items-center gap-2"
                  >
                    {icon ? (
                      <Image
                        src={icon}
                        alt=""
                        width={18}
                        height={18}
                        aria-hidden
                        className="pointer-events-none select-none rounded-sm"
                        unoptimized
                      />
                    ) : (
                      <span aria-hidden className="w-[18px] h-[18px] grid place-items-center text-accent">
                        ◆
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
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
