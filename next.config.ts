import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.dorbtz.com" },
    ],
  },
  experimental: {
    // Cover / gallery image uploads go through a Server Action. Next's default
    // Server Action body limit is 1 MB, which rejects most screenshots with a
    // 400 before our own 5 MB check runs. Raise it to comfortably fit a 5 MB
    // image plus multipart overhead.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  typedRoutes: true,
};

export default nextConfig;
