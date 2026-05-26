import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Pure-TS unit tests for now (utilities, type guards, data mappers).
    // RSC + browser tests live in Playwright (added later if needed).
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["legacy/**", "node_modules/**", ".next/**"],
    // The translate.ts module imports "server-only" which is a Next.js
    // build-time marker that throws when imported outside a Server
    // Component. Tests for translation logic stub or extract pure helpers.
  },
});
