"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders children only on PUBLIC routes (everything outside /admin and
 * /auth). Used to hide the public Header / Footer / Chatbot widgets on
 * admin pages, which have their own chrome (sidebar + sign-out).
 */
export function ConditionalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth/")) return null;
  return <>{children}</>;
}
