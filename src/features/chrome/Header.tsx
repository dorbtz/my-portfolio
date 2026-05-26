import Link from "next/link";

const NAV = [
  { label: "Work", href: "/#projects" },
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Resume", href: "/resume" },
];

export function Header() {
  return (
    <header
      // Sits in normal flow at the top of every page. Glass surface acquires
      // tint from the active theme tokens.
      className="w-full sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--color-bg)_75%,transparent)] border-b border-line"
    >
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto flex items-center justify-between h-14 sm:h-16">
        <Link
          href="/"
          className="font-semibold tracking-tight text-fg hover:text-accent transition-colors duration-snap"
        >
          dor<span className="text-accent">b</span>tz
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-pill text-body-sm font-medium text-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] transition-colors duration-snap min-h-[44px] inline-flex items-center"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
