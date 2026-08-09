import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "public-chromium",
      testMatch: ["**/accessibility/public-*.spec.ts", "**/end-to-end/public-*.spec.ts"],
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3000" },
    },
    {
      name: "hub-mobile",
      testMatch: ["**/accessibility/hub-*.spec.ts", "**/end-to-end/member-*.spec.ts"],
      use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3001" },
    },
    {
      name: "outreach-desktop",
      testMatch: ["**/accessibility/outreach-*.spec.ts", "**/end-to-end/outreach-*.spec.ts"],
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3002" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @church/public-web dev",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @church/church-hub dev",
      url: "http://127.0.0.1:3001/login",
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_ENABLE_DEMO: "true" },
    },
    {
      command: "pnpm --filter @church/outreach-command dev",
      url: "http://127.0.0.1:3002/login",
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_ENABLE_DEMO: "true" },
    },
  ],
});
