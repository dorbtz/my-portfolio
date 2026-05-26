import type { Metadata } from "next";
import { GlassCard } from "@/shared/ui/GlassCard";
import { Section } from "@/shared/ui/Section";
import { LoginForms } from "./LoginForms";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

type SearchParams = { reason?: string; next?: string };

const REASON_MESSAGE: Record<string, string> = {
  not_allowlisted: "You're signed in, but this email isn't on the admin allowlist.",
  missing_code: "The sign-in link was missing — please try sending a new one.",
  exchange_failed: "The sign-in link expired or was already used. Send a fresh one.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { reason } = await searchParams;
  const noticeText = reason ? REASON_MESSAGE[reason] ?? null : null;

  return (
    <main className="min-h-dvh">
      <Section padding={9} ariaLabel="Admin sign-in">
        <div className="max-w-md mx-auto">
          <p className="text-caption uppercase tracking-[0.18em] text-accent text-center">
            Admin
          </p>
          <h1 className="text-h1 font-bold tracking-tight mt-2 text-center">
            Sign in
          </h1>
          <p className="text-body-sm text-muted mt-2 text-center">
            Allowlisted emails only. Magic link is easiest; password works if you&apos;ve set one.
          </p>
          {noticeText && (
            <p
              role="status"
              className="mt-4 p-3 rounded-md bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)] border border-line text-body-sm text-fg text-center"
            >
              {noticeText}
            </p>
          )}
          <GlassCard padding={6} className="admin-card mt-6">
            <LoginForms />
          </GlassCard>
        </div>
      </Section>
    </main>
  );
}
