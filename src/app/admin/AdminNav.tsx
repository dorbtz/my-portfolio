"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Theme } from "@/shared/lib/theme/types";

/**
 * Admin sidebar / horizontal nav.  Lives in a Client Component so per-theme
 * icons swap LIVE the moment the user flips the theme switcher — no page
 * refresh needed (the old Server-Component implementation only re-read the
 * theme cookie on full navigation, which caused the icons-don't-update bug).
 *
 *   HighTech -> diamond glyph (clean minimal default)
 *   Thor     -> Marvel comic icons + comics-book card chrome (via globals.css)
 *   Luffy    -> One-Piece manga icons (full Straw-Hat roster + treasure map)
 *
 * Icon files live in /public/assets/Marvel/icons + /public/assets/One-Piece/icons.
 */

type NavItem = {
  label: string;
  href: string;
  thorIcon: string;
  /** Manga icon shown in Luffy theme — picked to match the nav role:
   *    Dashboard -> straw-hat flag (captain's flag = front page)
   *    Content   -> Nami (navigator = curates / organizes content)
   *    Messages  -> Brook (transponder-snail-style scout calls)
   *    Health    -> Chopper (the crew's doctor)
   *    MCP tools -> blue treasure map (the chatbot's tool catalog)
   *    Account   -> Robin (the archivist who keeps records)
   */
  luffyIcon: string;
};

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
    luffyIcon: "/assets/One-Piece/icons/nami.ico",
  },
  {
    label: "Messages",
    href: "/admin/messages",
    thorIcon: "/assets/Marvel/icons/spiderman.ico",
    luffyIcon: "/assets/One-Piece/icons/brook.ico",
  },
  {
    label: "Health",
    href: "/admin/health",
    thorIcon: "/assets/Marvel/icons/ironman.ico",
    luffyIcon: "/assets/One-Piece/icons/chooper.ico",
  },
  {
    label: "MCP tools",
    href: "/admin/mcp",
    thorIcon: "/assets/Marvel/icons/stan-lee.ico",
    luffyIcon: "/assets/One-Piece/icons/zoro.ico",
  },
  {
    label: "Account",
    href: "/admin/account",
    thorIcon: "/assets/Marvel/icons/blackpanther.ico",
    luffyIcon: "/assets/One-Piece/icons/robin.ico",
  },
];

function useActiveTheme(initial: Theme): Theme {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const v = el.dataset.theme;
      if (v === "thor" || v === "luffy" || v === "hightech") setTheme(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function AdminNav({ initialTheme }: { initialTheme: Theme }) {
  const theme = useActiveTheme(initialTheme);
  const themeIcon = (item: NavItem) =>
    theme === "thor" ? item.thorIcon : theme === "luffy" ? item.luffyIcon : null;

  return (
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
              <img
                src={icon}
                alt=""
                aria-hidden
                width={18}
                height={18}
                className="pointer-events-none select-none rounded-sm"
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
  );
}
