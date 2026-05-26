import type { Metadata, Viewport } from "next";
import { Bangers, Bebas_Neue, Geist } from "next/font/google";
import "./globals.css";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { FloatingControls } from "@/shared/ui/FloatingControls";
import { Header } from "@/features/chrome/Header";
import { Footer } from "@/features/chrome/Footer";
import { Chatbot } from "@/features/ai-chat/Chatbot";

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
      className={`${fontHightech.variable} ${fontThor.variable} ${fontLuffy.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Header />
        {children}
        <Footer />
        <FloatingControls initialTheme={theme} initialScheme={scheme} initialLocale={locale} />
        <Chatbot />
      </body>
    </html>
  );
}
