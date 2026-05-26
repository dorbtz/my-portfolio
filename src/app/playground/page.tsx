import type { Metadata } from "next";
import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { CodeReviewer } from "@/features/playground/CodeReviewer";
import { EntityExtractor } from "@/features/playground/EntityExtractor";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

export const metadata: Metadata = {
  title: "AI playground",
  description:
    "Live AI demos powered by Google Gemini. Code review (streaming) and structured entity extraction.",
};

const EYEBROW = "Live AI";
const TITLE = "Playground";
const BODY =
  "Two of the AI patterns this portfolio is built on, exposed for you to poke at. Powered by Google Gemini through the same Server-Action pipeline that runs the chatbot and the project recommender.";
const D1_LABEL = "Demo 1";
const D1_TITLE = "Streaming code reviewer";
const D1_BODY =
  "Paste any code snippet up to 2 KB. Gemini returns a 3-section review (summary / bugs / suggestions) that streams in word-by-word.";
const D2_LABEL = "Demo 2";
const D2_TITLE = "Structured entity extractor";
const D2_BODY =
  "Paste any paragraph. Returns strict JSON with people, organizations, dates, and a calibrated sentiment score. Validated server-side before rendering.";

export default async function PlaygroundPage() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: EYEBROW, contentType: "playground.eyebrow" },
    { en: TITLE, contentType: "playground.title" },
    { en: BODY, contentType: "playground.body" },
    { en: D1_LABEL, contentType: "playground.demo_label" },
    { en: D1_TITLE, contentType: "playground.d1_title" },
    { en: D1_BODY, contentType: "playground.d1_body" },
    { en: D2_LABEL, contentType: "playground.demo_label" },
    { en: D2_TITLE, contentType: "playground.d2_title" },
    { en: D2_BODY, contentType: "playground.d2_body" },
  ]);
  return (
    <main id="main-content" className="min-h-dvh">
      <Section padding={9} ariaLabel="AI playground">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(EYEBROW)}</p>
          <h1 className="text-display font-bold tracking-tight mt-2">{t(TITLE)}</h1>
          <p className="text-body text-muted mt-3 max-w-2xl">{t(BODY)}</p>
        </AppleSpring>

        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <AppleSpring kind="fade-up" delay={80}>
            <GlassCard padding={6} className="h-full">
              <p className="text-caption uppercase tracking-wider text-accent">{t(D1_LABEL)}</p>
              <h2 className="text-h2 font-semibold mt-1">{t(D1_TITLE)}</h2>
              <p className="text-body-sm text-muted mt-2">{t(D1_BODY)}</p>
              <div className="mt-4">
                <CodeReviewer />
              </div>
            </GlassCard>
          </AppleSpring>

          <AppleSpring kind="fade-up" delay={120}>
            <GlassCard padding={6} className="h-full">
              <p className="text-caption uppercase tracking-wider text-accent">{t(D2_LABEL)}</p>
              <h2 className="text-h2 font-semibold mt-1">{t(D2_TITLE)}</h2>
              <p className="text-body-sm text-muted mt-2">{t(D2_BODY)}</p>
              <div className="mt-4">
                <EntityExtractor />
              </div>
            </GlassCard>
          </AppleSpring>
        </div>
      </Section>
    </main>
  );
}
