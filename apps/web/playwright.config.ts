import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke testing.
 *
 * Playwright serves a production build (`next build` then `next start`) rather than the
 * dev server so the tests exercise what actually ships. `pnpm test:e2e` from the repo root
 * runs through Turborepo, which builds the app first.
 *
 * Port 3100 keeps `next start` out of the way of a `pnpm dev` server on 3000.
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "pnpm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
