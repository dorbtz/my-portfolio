import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    // Use vmThreads pool to avoid rolldown-vite SSR transform injecting
    // __vite_ssr_exportName__ helpers that aren't available in jsdom runtime.
    pool: "vmThreads",
  },
});
