import { GlassCard } from "@/shared/ui/GlassCard";
import { AppleSpring } from "@/shared/ui/AppleSpring";
import { Section } from "@/shared/ui/Section";
import { CONTACT } from "@/shared/data/sections";
import { PROFILE } from "@/shared/data/profile";
import { ContactForm } from "./ContactForm";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { localize } from "@/shared/lib/i18n/localize";

export async function Contact() {
  const { locale } = await readThemeState();
  const t = await localize(locale, [
    { en: CONTACT.eyebrow, contentType: "contact.eyebrow" },
    { en: CONTACT.title, contentType: "contact.title" },
    { en: CONTACT.body, contentType: "contact.body" },
    { en: CONTACT.emailLabel, contentType: "contact.email_label" },
  ]);
  return (
    <Section id="contact" ariaLabel="Contact">
      <div className="grid gap-6 lg:grid-cols-5">
        <AppleSpring kind="fade-up" className="lg:col-span-2">
          <p className="text-caption uppercase tracking-[0.18em] text-accent">{t(CONTACT.eyebrow)}</p>
          <h2 className="text-h1 font-bold mt-2">{t(CONTACT.title)}</h2>
          <p className="text-body text-muted mt-3">{t(CONTACT.body)}</p>
          <p className="text-body-sm text-muted mt-6">{t(CONTACT.emailLabel)}</p>
          <a
            href={`mailto:${PROFILE.email}`}
            className="text-body font-medium text-fg hover:text-accent transition-colors"
          >
            {PROFILE.email}
          </a>
        </AppleSpring>
        <AppleSpring kind="fade-up" delay={120} className="lg:col-span-3">
          <GlassCard padding={6}>
            <ContactForm />
          </GlassCard>
        </AppleSpring>
      </div>
    </Section>
  );
}
