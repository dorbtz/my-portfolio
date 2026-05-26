import type { Metadata } from "next";
import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { CodeReviewer } from "@/features/playground/CodeReviewer";
import { EntityExtractor } from "@/features/playground/EntityExtractor";

export const metadata: Metadata = {
  title: "AI playground",
  description:
    "Live AI demos powered by Google Gemini. Code review (streaming) and structured entity extraction.",
};

export default function PlaygroundPage() {
  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="AI playground">
        <AppleSpring kind="fade-up" trigger="mount">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">Live AI</p>
          <h1 className="text-display font-bold tracking-tight mt-2">Playground</h1>
          <p className="text-body text-muted mt-3 max-w-2xl">
            Two of the AI patterns this portfolio is built on, exposed for you to
            poke at. Powered by Google Gemini through the same Server-Action
            pipeline that runs the chatbot and the project recommender.
          </p>
        </AppleSpring>

        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <AppleSpring kind="fade-up" delay={80}>
            <GlassCard padding={6} className="h-full">
              <p className="text-caption uppercase tracking-wider text-accent">Demo 1</p>
              <h2 className="text-h2 font-semibold mt-1">Streaming code reviewer</h2>
              <p className="text-body-sm text-muted mt-2">
                Paste any code snippet up to 2&nbsp;KB. Gemini returns a 3-section
                review (summary / bugs / suggestions) that streams in word-by-word.
              </p>
              <div className="mt-4">
                <CodeReviewer />
              </div>
            </GlassCard>
          </AppleSpring>

          <AppleSpring kind="fade-up" delay={120}>
            <GlassCard padding={6} className="h-full">
              <p className="text-caption uppercase tracking-wider text-accent">Demo 2</p>
              <h2 className="text-h2 font-semibold mt-1">Structured entity extractor</h2>
              <p className="text-body-sm text-muted mt-2">
                Paste any paragraph. Returns strict JSON with people, organizations,
                dates, and a calibrated sentiment score. Validated server-side
                before rendering.
              </p>
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
