import type { Metadata, Viewport } from "next";
import "./globals.css";
import { readThemeState } from "@/shared/lib/theme/ssr";
import { FloatingControls } from "@/shared/ui/FloatingControls";
import { Header } from "@/features/chrome/Header";
import { Footer } from "@/features/chrome/Footer";

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
    <html lang={locale} dir={dir} data-theme={theme} data-scheme={schemeAttr} suppressHydrationWarning>
      <body>
        <Header />
        {children}
        <Footer />
        <FloatingControls initialTheme={theme} initialScheme={scheme} initialLocale={locale} />
      </body>
    </html>
  );
}
