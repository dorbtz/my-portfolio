/**
 * Footer — 3-column comic-book treatment with dual-fandom identity.
 *
 * Left: Dual-fandom logo (Mjolnir + Nika overlapping) + 2-line bio
 * Center: Nav links with Elder Futhark rune labels, Latin tooltip + aria-label
 * Right: Socials + contact CTA, kana SFX decorative letters
 * Bottom: Marquee scrolling text fusing both fandoms
 * Border: matches comic-header treatment (3px, mode-aware hairline)
 */
import type { ReactNode } from 'react';
import MjolnirSigil from './symbols/MjolnirSigil';
import NikaSun from './symbols/NikaSun';
import { useMode } from '../stores/mode';
import { PORTFOLIO } from '../lib/portfolioConfig';

const RUNE_NAV = [
  { label: 'Projects', rune: 'ᛈᚱᛟᛃᛖᚲᛏᛋ', href: '/#projects' },
  { label: 'About', rune: 'ᚨᛒᛟᚢᛏ', href: '/#about' },
  { label: 'Skills', rune: 'ᛋᚲᛁᛚᛚᛋ', href: '/#skills' },
  { label: 'Contact', rune: 'ᚲᛟᚾᛏᚨᚲᛏ', href: '/#contact' },
];

type SocialLink = {
  label: string;
  href: string;
  icon: ReactNode;
};

const ALL_SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'GitHub',
    href: PORTFOLIO.github,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.427 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: PORTFOLIO.linkedin,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-3a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      </svg>
    ),
  },
];

// Hide entries whose href is empty (forker hasn't set the env var yet).
const SOCIAL_LINKS: SocialLink[] = ALL_SOCIAL_LINKS.filter((l) => l.href.trim().length > 0);

// Marquee text — both fandoms fused
const MARQUEE_TEXT =
  'AI ENGINEER · LLM AGENTS · RAG · MJÖLNIR · BIFRÖST · ASGARD · GEAR 5 · LUFFY · SUN GOD NIKA · DRUMS OF LIBERATION · WANO · GUM-GUM · WHOSOEVER SHIPS THIS CODE · ';

export default function Footer() {
  const year = new Date().getFullYear();
  const mode = useMode();
  const isThor = mode === 'thor';

  return (
    <footer className={['comic-footer', isThor ? 'comic-footer--thor' : 'comic-footer--gear5'].join(' ')}>
      {/* Mode-aware top hairline */}
      <div className="comic-footer__hairline" aria-hidden="true" />

      {/* Main 3-column grid */}
      <div className="wrap">
        <div className="comic-footer__grid">

          {/* ---- Left: Dual-fandom logo + bio ---- */}
          <div className="comic-footer__left">
            <div className="comic-footer__logo" aria-label={`${PORTFOLIO.name} — Marvel x One Piece portfolio`}>
              {/* Overlapping icons — NikaSun turns white in Thor mode so it stays
                  visible against the dark Asgardian background. */}
              <span className="comic-footer__logo-icons" aria-hidden="true">
                <MjolnirSigil size={36} color="currentColor" className="comic-footer__logo-mjolnir" />
                <NikaSun size={36} color="currentColor" className="comic-footer__logo-nika" forceWhite={isThor} />
              </span>
              <div className="comic-footer__logo-text">
                <span
                  className="comic-footer__name"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {PORTFOLIO.name.toUpperCase()}
                </span>
                <span className="comic-footer__title">
                  {PORTFOLIO.title}
                </span>
              </div>
            </div>
            {PORTFOLIO.bio && (
              <p className="comic-footer__bio">
                {PORTFOLIO.bio}
              </p>
            )}
            <p className="comic-footer__copy">
              &copy; {year} {PORTFOLIO.name}
            </p>
            {/*
              Round 74 — credit watermark that survives forks (per user
              spec). Hardcoded by design — do NOT wire this to env vars.
            */}
            <p className="comic-footer__credit">
              Originally crafted by{' '}
              <a href="https://github.com/dorbtz" target="_blank" rel="noopener noreferrer">
                Dor Ben Tzur ↗
              </a>
            </p>
          </div>

          {/* ---- Center: Rune nav ---- */}
          <nav className="comic-footer__center" aria-label="Footer navigation">
            <span
              className="comic-footer__nav-heading"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NAVIGATE
            </span>
            <ul className="comic-footer__nav-list">
              {RUNE_NAV.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    aria-label={link.label}
                    className="comic-footer__nav-link"
                    data-thor-hover
                  >
                    {/* Rune display (aria-hidden — aria-label on <a> provides name) */}
                    <span
                      className="comic-footer__nav-rune"
                      aria-hidden="true"
                      title={link.label}
                      style={{ fontFamily: 'var(--font-runic)' }}
                    >
                      {link.rune}
                    </span>
                    {/* Latin transliteration — visible tooltip on hover */}
                    <span className="comic-footer__nav-latin">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---- Right: Socials + CTA + kana decoration ---- */}
          <div className="comic-footer__right">
            {/* Decorative kana SFX background letters */}
            <span className="comic-footer__kana-bg" aria-hidden="true"
              style={{ fontFamily: 'var(--font-jp)' }}>
              ドン!
            </span>

            <span
              className="comic-footer__section-heading"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CONNECT
            </span>

            {SOCIAL_LINKS.length > 0 && (
              <div className="comic-footer__socials">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="comic-footer__social-link"
                    data-thor-hover
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}

            <a
              href="/#contact"
              className="hire-me-btn comic-footer__cta"
            >
              {isThor ? '⚡ WORK WITH ME' : 'JOIN THE CREW!'}
            </a>

            <a
              href="/#hero"
              className="comic-footer__back-top"
              data-thor-hover
              aria-label="Back to top"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4 14l8-8 8 8H4z" />
              </svg>
              Back to top
            </a>
          </div>
        </div>

        {/* ---- Bottom strip: dual-fandom marquee ---- */}
        <div className="comic-footer__marquee-wrapper" aria-hidden="true">
          <div className="comic-footer__marquee-track">
            <span className="comic-footer__marquee-text" style={{ fontFamily: 'var(--font-comic-sfx)' }}>
              {MARQUEE_TEXT}{MARQUEE_TEXT}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
