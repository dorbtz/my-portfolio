import type { Metadata, Viewport } from "next";
import { Bangers, Bebas_Neue, Geist } from "next/font/google";
import "./globals.css";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { FloatingControls } from "@/shared/ui/FloatingControls";
import { Header } from "@/features/chrome/Header";
import { Footer } from "@/features/chrome/Footer";
import { Chatbot } from "@/features/ai-chat/Chatbot";
import { ConditionalChrome } from "@/shared/ui/ConditionalChrome";
import { EasterEggs } from "@/shared/ui/EasterEggs";
import { EasterEggEffects } from "@/shared/ui/EasterEggEffects";
import { SkipToContent } from "@/shared/ui/SkipToContent";
import { ThemeAmbience } from "@/features/effects/ThemeAmbience";

// Per-theme display fonts. Each theme's CSS sets --font-display to one of
// these variables; the body class string just makes the variables available.
const fontHightech = Geist({
  subsets: ["latin"],
  variable: "--font-hightech",
  display: "swap",
});
const fontThor = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-thor",
  display: "swap",
});
const fontLuffy = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-luffy",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorbtz.com"),
  title: {
    default: "Dor Ben Tzur — Full-Stack & AI Engineer",
    template: "%s — Dor Ben Tzur",
  },
  description:
    "Portfolio of Dor Ben Tzur. Modern web architecture, 3D interactive applications, AI-driven solutions. Next.js, Supabase, Vercel AI Gateway.",
  authors: [{ name: "Dor Ben Tzur", url: "https://dorbtz.com" }],
  openGraph: { type: "website", siteName: "Dor Ben Tzur", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // Google AdSense site-ownership verification. Renders
  // <meta name="google-adsense-account" content="ca-pub-…"> in <head>.
  // Verification only — no ad script, no auto-placed ads.
  ...(process.env.NEXT_PUBLIC_ADSENSE_ID
    ? { other: { "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_ID } }
    : {}),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D12" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, scheme, locale } = await readThemeState();
  const schemeAttr = scheme === "auto" ? undefined : scheme;
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={theme}
      data-scheme={schemeAttr}
      // Tell Next not to scroll-smooth during route transitions (avoids the
      // double-scroll feel when navigating between pages). CSS smooth-scroll
      // still applies to in-page anchor jumps thanks to the same attribute.
      data-scroll-behavior="smooth"
      className={`${fontHightech.variable} ${fontThor.variable} ${fontLuffy.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SkipToContent />
        {/* Per-theme atmospheric layers (Luffy rain / Thor storm). Lazy-loaded
            + self-gate on data-theme so HighTech ships none of this JS. */}
        <ConditionalChrome>
          <ThemeAmbience />
        </ConditionalChrome>
        <ConditionalChrome>
          <Header />
        </ConditionalChrome>
        {children}
        <ConditionalChrome>
          <Footer />
        </ConditionalChrome>
        <FloatingControls initialTheme={theme} initialScheme={scheme} initialLocale={locale} />
        <ConditionalChrome>
          <Chatbot />
        </ConditionalChrome>
        <EasterEggs />
        <EasterEggEffects />
      </body>
    </html>
  );
}
