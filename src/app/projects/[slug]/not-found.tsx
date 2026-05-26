import Link from "next/link";
import { Section } from "@/shared/ui/Section";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";

export default function ProjectNotFound() {
  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="Not found">
        <GlassCard padding={7} className="max-w-xl mx-auto text-center">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">404</p>
          <h1 className="text-h1 font-bold mt-2">That project doesn&apos;t exist.</h1>
          <p className="text-body text-muted mt-3">
            It might be hidden behind a draft flag, or just not real yet.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/projects">
              <GlassButton variant="primary">All projects</GlassButton>
            </Link>
          </div>
        </GlassCard>
      </Section>
    </main>
  );
}
