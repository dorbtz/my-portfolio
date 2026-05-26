import { ImageResponse } from "next/og";

/**
 * Dynamic OG image used by social share previews (LinkedIn, X, Slack,
 * iMessage, etc.) for /. Next.js 16 auto-wires this into the page's
 * OG metadata.
 *
 * Always renders in the default High-Tech dark scheme — social crawlers
 * don't carry the visitor's theme cookie. EN only (also for crawler
 * consistency).
 */
export const alt = "Dor Ben Tzur — Full-Stack & AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #0B0D12 0%, #14171f 60%, #0B0D12 100%)",
          color: "#F7F8FA",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top-right vibrancy accent — matches the High-Tech cyan glow */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 540,
            height: 540,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,212,255,0.45) 0%, transparent 70%)",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            letterSpacing: 4,
            color: "#00D4FF",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          dorbtz.com
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            Dor Ben Tzur
          </div>
          <div
            style={{
              fontSize: 44,
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#A1A6B3",
              maxWidth: 1000,
            }}
          >
            Full-Stack &amp; AI Engineer
          </div>
        </div>

        {/* Bottom row: stack chips */}
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "#A1A6B3",
            flexWrap: "wrap",
          }}
        >
          {[
            "Next.js 16",
            "Supabase",
            "Vercel AI Gateway",
            "Liquid Glass",
            "RAG",
          ].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(247,248,250,0.14)",
                background: "rgba(20,22,28,0.5)",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
