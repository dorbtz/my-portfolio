import { useCallback, useEffect, useState } from "react";

export default function ThemeToggleIcon() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Bootstrap from storage / media
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const next = saved ?? (prefersDark ? "dark" : "light");
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className="rounded-full p-2 border border-white/15 hover:bg-white/5"
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      {theme === "dark" ? (
        // Sun
        <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-90">
          <path fill="currentColor"
            d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79L6.76 4.84Zm10.48 14.32l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79ZM12 4V1H11v3h1Zm0 19v-3h-1v3h1ZM4 13H1v-1h3v1Zm19 0h-3v-1h3v1ZM6.76 19.16l-1.8 1.79l-1.79-1.79l1.79-1.79l1.8 1.79ZM19.16 6.76l1.79-1.79l-1.79-1.79l-1.79 1.79l1.79 1.79ZM12 6a6 6 0 100 12 6 6 0 000-12Z"/>
        </svg>
      ) : (
        // Moon
        <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-90">
          <path fill="currentColor"
            d="M21.64 13a9 9 0 01-11.31-11.31A9 9 0 1021.64 13Z"/>
        </svg>
      )}
    </button>
  );
}
