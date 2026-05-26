import Link from "next/link";
import { PROFILE } from "@/shared/data/profile";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-line mt-16">
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto py-10 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-semibold text-fg">{PROFILE.name}</p>
          <p className="text-body-sm text-muted mt-1">{PROFILE.headline}</p>
          <p className="text-body-sm text-muted mt-1">{PROFILE.location}</p>
        </div>
        <div className="sm:text-end flex flex-col gap-2 sm:items-end">
          <a
            href={`mailto:${PROFILE.email}`}
            className="text-body-sm text-fg hover:text-accent transition-colors"
          >
            {PROFILE.email}
          </a>
          <div className="flex gap-3 sm:justify-end">
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noreferrer noopener"
              className="text-body-sm text-muted hover:text-accent transition-colors"
            >
              GitHub
            </a>
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="text-body-sm text-muted hover:text-accent transition-colors"
            >
              LinkedIn
            </a>
            <Link
              href="/status"
              className="text-body-sm text-muted hover:text-accent transition-colors"
            >
              Status
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto py-4 text-caption text-muted flex flex-wrap items-center justify-between gap-2">
          <span>
            © {year} {PROFILE.name}. Built with Next.js 16, Supabase, Vercel AI
            Gateway.
          </span>
          <Link href="/admin" className="hover:text-accent transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
