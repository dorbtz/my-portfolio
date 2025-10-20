// src/components/Header.tsx
import { useEffect, useState } from "react";
import ThemeToggleIcon from "./ThemeToggleIcon";
import { useThor } from "../state/thor";

/* -------- Navigation config (absolute hashes) -------- */
const LINKS = [
  { href: "/#about",    label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills",   label: "Skills" },
  { href: "/#contact",  label: "Contact" },
  { href: "/demos/helixops", label: "HelixOps" }, // keep as a normal route
];

/* -------- Thor switch (reusable) -------- */
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
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      title="Toggle Thor Mode"
      className={[
        "group inline-flex items-center gap-2 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        compact ? "px-2.5 py-1 text-[13px]" : "px-3 py-1.5 text-[15px]",
        on
          ? "border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent)/.10)] text-[rgb(var(--color-silver))]"
          : "border-white/20 hover:bg-white/5 text-[rgb(var(--color-silver))]/85",
        className,
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1 opacity-90">
        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
          <path fill="currentColor" d="M13 2L3 14h7l-1 8l10-12h-7l1-8Z" />
        </svg>
        Thor
      </span>
      <span
        className={`relative inline-flex h-[18px] w-8 items-center rounded-full transition
          ${on ? "bg-[rgb(var(--color-accent-2))]/70" : "bg-white/15"}`}
      >
        <span
          className={`absolute h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-200
            ${on ? "translate-x-[18px]" : "translate-x-[2px]"}`}
        />
      </span>
    </button>
  );
}

/* -------- Header -------- */
export default function Header() {
  const { on: thorOn, toggle } = useThor();
  const [open, setOpen] = useState(false);

  // Ensure theme is applied on first paint
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const next = saved ?? (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  // Lock body scroll when drawer is open (mobile)
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[40] border-b border-white/10
                 bg-[rgb(var(--color-bg)/.65)] backdrop-blur
                 supports-[backdrop-filter]:bg-[rgb(var(--color-bg)/.55)]"
      style={{ height: "var(--hdr-h)" }}
    >
      <div className="nav-wrap relative h-full flex items-center justify-between">
        {/* Left: Brand */}
        <a
          href="/#hero"
          className="min-w-max font-semibold tracking-tight gradient-text text-xl
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
        >
          Dor Ben Tzur
        </a>

        {/* Center (desktop/tablet) */}
        <div
          className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-9 text-[18px] whitespace-nowrap"
          style={{ top: "50%", transform: "translate(-50%,-50%)" }}
          aria-label="Primary"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-thor-hover
              className="hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1 py-0.5"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right: actions (desktop/tablet) */}
        <div className="hidden md:flex items-center gap-3 whitespace-nowrap">
          <ThemeToggleIcon />
          <ThorSwitch on={thorOn} toggle={() => toggle()} />
          <a href="/#contact" data-thor-hover className="btn btn-primary">Hire Me</a>
        </div>

        {/* Right: hamburger (mobile) */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="rounded-md p-2 border border-white/15 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-90">
              <path fill="currentColor" d="M4 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-[49] bg-black/45 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 z-[50] h-screen w-[86vw] max-w-[380px] md:hidden
                       border-l border-white/10 bg-[rgb(var(--color-bg))] p-4 pt-[calc(var(--hdr-h)+.5rem)]
                       flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ThemeToggleIcon />
                <span className="mx-1 select-none opacity-40">|</span>
                <ThorSwitch on={thorOn} toggle={() => toggle()} compact />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/15 px-2 py-1 opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="mt-4 flex flex-col text-lg" aria-label="Mobile">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 rounded-md hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto grid gap-2 pb-[env(safe-area-inset-bottom)]">
              <a href="/#contact" data-thor-hover onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Hire Me
              </a>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
