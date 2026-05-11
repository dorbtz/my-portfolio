/**
 * src/components/About.tsx
 * Comic-panel about section — 5 panels, GSAP scroll-reveal, mode-aware SFX bursts.
 *
 * Panel layout (CSS Grid named areas):
 *   Desktop (≥960px):
 *     [beginning  ] [training  ]
 *     [beginning  ] [battle    ]
 *     [team       ] [whats-next]
 *
 *   Mobile: single column stack.
 *
 * Lottie SFX files (public/lottie/sfx-*.lottie) are placeholders — they do not
 * exist yet. The <DotLottieReact> components are wrapped in an error boundary so
 * a 404 silently renders nothing. CSS-styled fallback burst <div>s are always
 * rendered as a reliable alternative.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import Section from './Section';
import { gsap } from '../lib/gsap';
import { withMotion } from '../lib/gsap';
import { useMode } from '../stores/mode';
import { useSiteContent } from '../features/content/hooks/useSiteContent';

// ---------------------------------------------------------------------------
// SFX burst component (CSS-only — reliable across all browsers)
// Lottie approach is deferred until placeholder .lottie files are in place.
// ---------------------------------------------------------------------------

type BurstProps = {
  text: string;
  className?: string;
  rotation?: number;
};

function SfxBurst({ text, className = '', rotation = -8 }: BurstProps) {
  return (
    <span
      aria-hidden="true"
      className={`comic-sfx-burst ${className}`}
      style={{ '--burst-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Halftone background helper (Ben-Day dots via CSS radial-gradient)
// ---------------------------------------------------------------------------

function HalftoneOverlay() {
  return (
    <span
      aria-hidden="true"
      className="comic-halftone"
    />
  );
}

// ---------------------------------------------------------------------------
// Individual panel
// ---------------------------------------------------------------------------

type PanelProps = {
  id: string;
  kicker: string;
  caption?: string;
  children: ReactNode;
  burstText?: string;
  burstRotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

function ComicPanel({
  id,
  kicker,
  caption,
  children,
  burstText,
  burstRotation = -8,
  className = '',
  style,
}: PanelProps) {
  return (
    <article
      id={id}
      className={`comic-panel ${className}`}
      style={style}
    >
      <HalftoneOverlay />

      {/* Kicker strip */}
      <header className="comic-panel__kicker" aria-label={`Panel: ${kicker}`}>
        {kicker}
      </header>

      {/* Body */}
      <div className="comic-panel__body">
        {children}
      </div>

      {/* Optional caption strip */}
      {caption ? (
        <footer className="comic-panel__caption">
          {caption}
        </footer>
      ) : null}

      {/* SFX burst */}
      {burstText ? (
        <SfxBurst text={burstText} rotation={burstRotation} />
      ) : null}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function About() {
  const mode = useMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const copy = useSiteContent('about');
  // Helper — DB value if string, else fallback. Keeps the JSX scannable.
  const t = (field: string, fallback: string): string => {
    const v = copy[field];
    return typeof v === 'string' ? v : fallback;
  };

  // GSAP scroll-reveal: each panel animates in on ScrollTrigger entry.
  // Wrapped in withMotion so it is a no-op when the user prefers reduced motion.
  // Guards: skip silently if panels haven't mounted yet, AND skip any individual
  // panel that turns out to be detached (defensive — prevents the 4× "GSAP
  // target not found" warning that fired when ScrollTrigger.refresh() ran after
  // an unrelated layout shift like the contact-section GLB loading in).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const panels = Array.from(el.querySelectorAll<HTMLElement>('.comic-panel'));
    if (panels.length === 0) return;

    const ctx = gsap.context(() => {
      withMotion(() => {
        panels.forEach((panel, i) => {
          if (!panel || !panel.isConnected) return;
          gsap.from(panel, {
            y: 48,
            scale: 0.97,
            opacity: 0,
            duration: 0.65,
            ease: 'power2.out',
            delay: i * 0.08,
            scrollTrigger: {
              trigger: panel,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          });
        });
      });
    }, el);

    return () => {
      ctx.revert();
    };
  }, []);

  // Mode-aware SFX burst texts (CMS-driven; defaults preserved as fallback)
  const isThor = mode === 'thor';
  const burst1 = t('burst1', isThor ? 'CRUNCH!' : 'ドン!');
  const burst2 = t('burst2', isThor ? 'EUREKA!' : 'ボン!');
  const burst3 = t('burst3', isThor ? 'POW!' : 'DON!');

  return (
    <Section id="about" label="About">
      {/* Screen-reader summary */}
      <h2 className="sr-only">About — the story behind the work</h2>

      <div ref={containerRef} className="comic-page" aria-label="Comic-panel biography">
        {/* Panel 1 — THE BEGINNING (spans 2 rows) */}
        <ComicPanel
          id="about-beginning"
          kicker={t('panel1Kicker', 'THE BEGINNING')}
          caption={t('panel1Caption', 'Every hero has an origin. Mine had a blinking cursor.')}
          burstText={burst1}
          burstRotation={-10}
          className="comic-panel--beginning"
        >
          <p>{t('panel1Body1', 'One line of code. Hello, world. A question I couldn’t unhear: "What if I could make the screen do anything?" Whosoever holds that question, if they be patient enough, shall possess the power.')}</p>
          <p>{t('panel1Body2', 'From scrappy HTML pages to full-stack apps shipping to real users — the obsession never changed, only the tools. The dream was always to build something people love to use.')}</p>
        </ComicPanel>

        {/* Panel 2 — THE TRAINING MONTAGE */}
        <ComicPanel
          id="about-training"
          kicker={t('panel2Kicker', 'THE TRAINING MONTAGE')}
          caption={t('panel2Caption', 'Mt. Colubo was a metaphor. The grind was real.')}
          burstText={burst2}
          burstRotation={8}
          className="comic-panel--training"
        >
          <p>{t('panel2Body1', 'React, TypeScript, Node, then deeper — Postgres internals, GLSL shaders, accessibility specs at 2 AM. Every framework a new gear. Every paradigm a new transformation. Gear 2 was speed. Gear 3 was scale.')}</p>
          <p>{t('panel2Body2', 'Then the LLM wave hit. RAG pipelines, agent orchestration, evals, vector search. Gear 4 unlocked. Suddenly the screen could think back.')}</p>
        </ComicPanel>

        {/* Panel 3 — THE FIRST BATTLE */}
        <ComicPanel
          id="about-battle"
          kicker={t('panel3Kicker', 'THE FIRST BATTLE')}
          caption={t('panel3Caption', 'Production. Real users. No respawn.')}
          className="comic-panel--battle"
        >
          <p>{t('panel3Body1', 'First feature in front of real users — a real-time collab layer that had to work on day one. It did. Then a 3 AM page: a query timeout under load. Welcome to production. Welcome to the Grand Line.')}</p>
          <p>{t('panel3Body2', 'Lesson learned: performance is a feature, error states are first-class citizens, and every screen deserves a keyboard. Mjolnir doesn’t fly itself.')}</p>
        </ComicPanel>

        {/* Panel 4 — THE TEAM */}
        <ComicPanel
          id="about-team"
          kicker={t('panel4Kicker', 'THE CREW')}
          caption={t('panel4Caption', 'No Pirate King sails alone. No Avenger flies solo.')}
          className="comic-panel--team"
        >
          <p>{t('panel4Body1', 'Designers, PMs, ML engineers, infra wizards — the Straw Hats of every project. Pairing with brilliant people on hard problems is the whole point. Code reviews are how we lift each other’s craft.')}</p>
          <p>{t('panel4Body2', 'Collaboration is the real superpower. Mjolnir is just the delivery mechanism. Gum-Gum-Bazooka, but for shipping features.')}</p>
        </ComicPanel>

        {/* Panel 5 — WHAT'S NEXT (mode-aware awakening treatment) */}
        <ComicPanel
          id="about-next"
          kicker={t('panel5Kicker', "WHAT'S NEXT")}
          caption={t('panel5Caption', isThor ? 'The thunder never stops.' : '— ギア5覚醒 —')}
          burstText={burst3}
          burstRotation={6}
          className={`comic-panel--next ${isThor ? 'comic-panel--next-thor' : 'comic-panel--next-gear5'}`}
        >
          {/* Sun-rays SVG — shown only in Gear 5 mode */}
          {!isThor && (
            <span aria-hidden="true" className="comic-panel__sun-rays">
              <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="100"
                    x2={100 + 90 * Math.cos((i * Math.PI * 2) / 12)}
                    y2={100 + 90 * Math.sin((i * Math.PI * 2) / 12)}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                ))}
              </svg>
            </span>
          )}
          <p>
            {t('panel5Body1', isThor
              ? 'Building AI-powered products where Asgardian engineering polish meets agent-grade reasoning. RAG over your data, LLM agents that ship, R3F scenes that ship, design systems that scale.'
              : '覚醒。 Gear 5 unlocked. Building AI-powered products that ship at impossible speed — RAG, agents, evals, frontend that flies. The next arc is all about joy of use.')}
          </p>
          <p>
            {t('panel5Body2', isThor
              ? 'Open to senior roles & contracts. If the challenge is worthy of Mjolnir, reach out.'
              : "If your product needs Sun God-level craft and AI-grade velocity — let's build something legendary.")}
          </p>
        </ComicPanel>
      </div>
    </Section>
  );
}
