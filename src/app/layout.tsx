import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorbtz.com"),
  title: {
    default: "Dor Ben Tzur — Full-Stack & AI Engineer",
    template: "%s — Dor Ben Tzur",
  },
  description:
    "Portfolio of Dor Ben Tzur. Modern web architecture, 3D interactive applications, AI-driven solutions. Next.js, Supabase, Vercel AI Gateway.",
  authors: [{ name: "Dor Ben Tzur", url: "https://dorbtz.com" }],
  openGraph: {
    type: "website",
    siteName: "Dor Ben Tzur",
    locale: "en_US",
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="hightech" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
