import Link from "next/link";
import { PROFILE } from "@/shared/data/profile";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { getChromeStrings } from "@/shared/lib/i18n/chrome";
import { FooterName } from "./FooterName";

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
          <FooterName name={PROFILE.name} />
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
        {/* Extra bottom padding so the fixed "Ask my portfolio" chat bubble
            (bottom-right) never covers the footer text on small screens. */}
        <div className="max-w-[min(1200px,calc(100%-2rem))] mx-auto py-4 pb-20 sm:pb-4 text-caption text-muted">
          <span>
            © {year} {PROFILE.name}.
          </span>
        </div>
      </div>
    </footer>
  );
}
