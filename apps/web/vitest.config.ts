import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors the `@/*` path mapping in tsconfig.json.
      "@": rootDir,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    // Component and boundary tests only. End-to-end coverage is Playwright's job.
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
