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
    // Serialize the VM contexts so cleanup doesn't race during process exit.
    // Without this, vitest's worker teardown can segfault (exit code 139 on
    // Linux CI, "Segmentation fault" on npx Windows) even though every test
    // passed. singleThread=true keeps the rolldown SSR fix from above while
    // making the cleanup deterministic.
    poolOptions: {
      vmThreads: {
        singleThread: true,
      },
    },
  },
});
