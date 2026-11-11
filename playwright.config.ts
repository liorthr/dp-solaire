import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3123);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [["list"]],
  use: { baseURL, acceptDownloads: true, trace: "off" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }, { name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx http-server out -p ${PORT} -s -c-1`,
        port: PORT,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
