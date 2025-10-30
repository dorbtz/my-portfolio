import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import ThemeToggleIcon from "./ThemeToggleIcon";
import { useThor } from "../state/thor";
import { useAuth } from "../hooks/useAuth";

type NavItem = {
  label: string;
  href: string;
  id?: string;
};

const SECTION_LINKS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

const SECTION_IDS = SECTION_LINKS.map((link) => link.id) as readonly string[];

function useActiveSection(sectionIds: readonly string[]): [string, (id: string) => void] {
  const [active, setActive] = useState<string>(() => {
    if (typeof window === "undefined") return sectionIds[0] ?? "";
    const hash = window.location.hash.replace("#", "");
    if (hash && sectionIds.includes(hash)) return hash;
    return sectionIds[0] ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.pathname !== "/") {
      setActive("");
      return;
    }

    const hash = window.location.hash.replace("#", "");
    if (hash && sectionIds.includes(hash)) {
      setActive(hash);
    } else {
      setActive((prev) => (prev ? prev : sectionIds[0] ?? ""));
    }

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActive(visible[0].target.id);
          return;
        }

        const fallback = sections
          .filter((section) => section.getBoundingClientRect().top <= window.innerHeight * 0.4)
          .at(-1);

        if (fallback) {
          setActive(fallback.id);
        }
      },
      { threshold: [0.35, 0.5, 0.65], rootMargin: "-45% 0px -45% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sectionIds.includes(hash)) {
        setActive(hash);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [sectionIds]);

  return [active, setActive];
}

function ThorSwitch({
  on,
  toggle,
  compact = false,
  className = "",
}: {
  on: boolean;
  toggle: () => void;
  compact?: boolean;
  className?: string;
}) {
  const trackClass = compact ? "h-[16px] w-[30px]" : "h-[18px] w-9";
  const knobClass = compact ? "h-[14px] w-[14px]" : "h-[16px] w-[16px]";
  const knobTranslate = on ? (compact ? 14 : 18) : 2;

  const style = on
    ? {
        background: "linear-gradient(90deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))",
        color: "#fff",
        border: "1px solid transparent",
        boxShadow: "0 12px 30px rgb(var(--color-accent) / 0.35)",
      }
    : {
        background: "rgb(var(--color-bg-soft) / 0.55)",
        color: "rgb(var(--color-ink) / 0.78)",
        border: "1px solid rgb(var(--color-border-strong) / 0.28)",
      };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      title="Toggle Thor Mode"
      className={[
        "group inline-flex items-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.45)]",
        compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        className,
      ].join(" ")}
      style={style}
    >
      <span className="inline-flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
          <path fill="currentColor" d="M13 2L3 14h7l-1 8l10-12h-7l1-8Z" />
        </svg>
        Thor
      </span>
      <span
        className={`relative inline-flex items-center rounded-full transition-colors duration-200 ${trackClass}`}
        style={{
          background: on
            ? "rgb(var(--color-highlight) / 0.5)"
            : "rgb(var(--color-border-strong) / 0.22)",
        }}
      >
        <span
          className={`absolute rounded-full bg-white shadow transition-transform duration-200 ${knobClass}`}
          style={{ transform: `translateX(${knobTranslate}px)` }}
        />
      </span>
    </button>
  );
}

export default function Header() {
  const { on: thorOn, toggle } = useThor();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useActiveSection(SECTION_IDS);

  const navLinks = useMemo<NavItem[]>(() => {
    const sectionItems: NavItem[] = SECTION_LINKS.map((link) => ({
      label: link.label,
      href: `/#${link.id}`,
      id: link.id,
    }));
    const extras: NavItem[] = [];
    if (user) {
      extras.push({ label: "Admin", href: "/admin/projects" });
    }
    return [...sectionItems, ...extras];
  }, [user]);

  useEffect(() => {
    const { style } = document.body;
    const prev = style.overflow;
    if (open) style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, [open]);

  const handleSectionNav = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      if (typeof window === "undefined") return;
      const isHome = window.location.pathname === "/";

      if (!isHome) {
        setOpen(false);
        return;
      }

      event.preventDefault();
      setOpen(false);
      setActiveSection(id);

      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", `/#${id}`);
        }
      });
    },
    [setActiveSection]
  );

  return (
    <header className="site-header">
      <div className="nav-wrap flex h-full items-center justify-between gap-4">
        <a
          href="/#hero"
          className="inline-flex min-w-max flex-col gap-0.5 font-semibold tracking-tight text-lg leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.45)]"
        >
          <span
            className="uppercase text-[11px] tracking-[0.32em]"
            style={{ color: "rgb(var(--color-muted) / 0.7)" }}
          >
            Portfolio
          </span>
          <span className="text-2xl font-semibold">Dor Ben Tzur</span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const isSection = Boolean(link.id);
            const dataActive = isSection && activeSection === link.id ? "true" : undefined;
            const onClick = isSection
              ? (event: MouseEvent<HTMLAnchorElement>) => handleSectionNav(event, link.id!)
              : undefined;
            return (
              <a
                key={link.label}
                href={link.href}
                data-thor-hover
                data-active={dataActive}
                className="nav-link"
                onClick={onClick}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggleIcon />
          <ThorSwitch on={thorOn} toggle={() => toggle()} />
          {user ? (
            <a
              href="/admin/projects"
              className="glass-tile inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium"
            >
              Admin
            </a>
          ) : null}
          <a
            href="/#contact"
            data-thor-hover
            className="btn btn-primary"
            onClick={(event) => handleSectionNav(event, "contact")}
          >
            Hire Me
          </a>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.45)]"
          onClick={() => setOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" className="opacity-85">
            <path
              fill="currentColor"
              d="M4 6.25C4 5.55964 4.55964 5 5.25 5H18.75C19.4404 5 20 5.55964 20 6.25C20 6.94036 19.4404 7.5 18.75 7.5H5.25C4.55964 7.5 4 6.94036 4 6.25ZM4 12C4 11.3096 4.55964 10.75 5.25 10.75H18.75C19.4404 10.75 20 11.3096 20 12C20 12.6904 19.4404 13.25 18.75 13.25H5.25C4.55964 13.25 4 12.6904 4 12ZM5.25 16.5C4.55964 16.5 4 17.0596 4 17.75C4 18.4404 4.55964 19 5.25 19H18.75C19.4404 19 20 18.4404 20 17.75C20 17.0596 19.4404 16.5 18.75 16.5H5.25Z"
            />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[49] bg-black/55 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 z-[50] h-screen w-[86vw] max-w-[400px] md:hidden
                       border-l border-white/12 bg-[rgb(var(--color-bg)/0.85)] backdrop-blur-2xl
                       pt-[calc(var(--hdr-h)+1rem)] pb-6 px-6 flex flex-col gap-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="glass-tile flex items-center gap-3 rounded-2xl px-3 py-2">
                <span
                  className="text-xs uppercase tracking-[0.28em]"
                  style={{ color: "rgb(var(--color-muted) / 0.65)" }}
                >
                  Menu
                </span>
                <span className="text-sm font-semibold">Dor Ben Tzur</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.45)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.7a1 1 0 1 0-1.41 1.42L10.58 12l-4.87 4.88a1 1 0 1 0 1.41 1.41L12 13.41l4.88 4.88a1 1 0 0 0 1.41-1.41L13.42 12l4.88-4.88a1 1 0 0 0 0-1.41Z"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-2 text-lg font-semibold" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isSection = Boolean(link.id);
                const onClick = isSection
                  ? (event: MouseEvent<HTMLAnchorElement>) => handleSectionNav(event, link.id!)
                  : () => setOpen(false);
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    data-thor-hover
                    className="rounded-2xl px-3 py-3 transition hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-highlight)/0.35)]"
                    onClick={onClick}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="glass-tile flex items-center justify-between rounded-2xl px-3 py-2">
                <ThemeToggleIcon />
                <ThorSwitch on={thorOn} toggle={() => toggle()} compact />
              </div>
              {user ? (
                <a
                  href="/admin/projects"
                  className="glass-tile block rounded-2xl px-3 py-2 text-center text-sm font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Admin dashboard
                </a>
              ) : null}
              <a
                href="/#contact"
                data-thor-hover
                className="btn btn-primary w-full"
                onClick={(event) => handleSectionNav(event, "contact")}
              >
                Hire Me
              </a>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

