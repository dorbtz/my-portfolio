import Link from "next/link";
import { PROFILE } from "@/shared/data/profile";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";

export async function Footer() {
  const year = new Date().getFullYear();
  const { locale } = await readThemeState();
  const t = getChromeStrings(locale);

  return (
    // Pin LTR so the footer's column / link layout doesn't flip in HE mode.
    // The footer's primary content (name, email, social handles) is Latin/brand.
    <footer dir="ltr" className="w-full border-t border-line mt-16">
      <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto py-10 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-semibold text-fg">{PROFILE.name}</p>
          <p className="text-body-sm text-muted mt-1">{PROFILE.headline}</p>
          <p className="text-body-sm text-muted mt-1">{PROFILE.location}</p>
        </div>
        <div className="sm:text-right flex flex-col gap-2 sm:items-end">
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
              {t.footer.status}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto py-4 text-caption text-muted flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              © {year} {PROFILE.name}. {t.footer.builtWith}
            </span>
            <span aria-hidden className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1">
              Crafted with
              <a
                href="https://claude.com/claude-code"
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-fg hover:text-accent transition-colors"
              >
                Claude
              </a>
            </span>
          </span>
          <Link href="/admin" className="hover:text-accent transition-colors">
            {t.footer.admin}
          </Link>
        </div>
      </div>
    </footer>
  );
}
