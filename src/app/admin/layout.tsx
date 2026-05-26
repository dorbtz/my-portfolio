import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser, isAllowlistedAdmin } from "@/shared/lib/auth/server";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Content", href: "/admin/content" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Health", href: "/admin/health" },
  { label: "MCP tools", href: "/admin/mcp" },
  { label: "Account", href: "/admin/account" },
];

/**
 * Admin shell — wraps every /admin/** route except /admin/login itself.
 * Renders a glass sidebar nav + main content slot. Middleware already
 * gated the route; layout only fetches the user for the signed-in chrome.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // If the session is gone but middleware let us through (race), surface a
  // minimal layout. Pages also call requireAdmin() for defense in depth.
  const signedIn = Boolean(user && (await isAllowlistedAdmin(user.email)));

  return (
    <div className="min-h-dvh">
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto grid gap-6 lg:grid-cols-[220px_1fr] pt-8 pb-16">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav aria-label="Admin sections" className="glass rounded-lg p-2 flex lg:flex-col gap-1 flex-wrap">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-body-sm font-medium text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
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
  );
}
