import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.NO_WEBSERVER
    ? undefined
    : [
        {
          command:
            "PORT=3001 DATABASE_URL=postgres://ember:ember@localhost:5432/ember AUTH_SECRET=dev-secret-change-me-with-openssl-rand-base64-32 node api/dist/src/index.js",
          url: "http://localhost:3001/health",
          reuseExistingServer: true,
          timeout: 15000,
        },
        {
          command:
            "PORT=3000 API_URL=http://localhost:3001 DATABASE_URL=postgres://ember:ember@localhost:5432/ember AUTH_SECRET=dev-secret-change-me-with-openssl-rand-base64-32 AUTH_TRUST_HOST=true NEXTAUTH_URL=http://localhost:3000 AUTH_URL=http://localhost:3000 node .next/standalone/server.js",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 15000,
        },
      ],
});
