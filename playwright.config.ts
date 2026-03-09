import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Directory where E2E test files live
  testDir: "./e2e",

  // Run tests in files in parallel
  fullyParallel: false, // Keep false — tests share a real database, order can matter

  // Fail the build on CI if you accidentally left test.only in source
  forbidOnly: !!process.env.CI,

  // Retry failing tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Single worker to prevent race conditions on shared database
  workers: 1,

  // Reporter: list in terminal, HTML report saved to playwright-report/
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    // Base URL for page.goto("/login") to resolve correctly
    baseURL: "http://localhost:3000",

    // Collect trace on first retry — useful for debugging CI failures
    trace: "on-first-retry",

    // Run browser in headless mode (no visible window)
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // In CI, Playwright starts the servers automatically.
  // Locally, start them yourself: `npm run dev` in both backend/ and frontend/.
  ...(process.env.CI
    ? {
        webServer: [
          {
            command: "npm run dev",
            cwd: "./backend",
            url: "http://localhost:5000/api/health",
            reuseExistingServer: false,
            timeout: 60000,
          },
          {
            command: "npm run dev",
            cwd: "./frontend",
            url: "http://localhost:3000",
            reuseExistingServer: false,
            timeout: 60000,
          },
        ],
      }
    : {}),
});
