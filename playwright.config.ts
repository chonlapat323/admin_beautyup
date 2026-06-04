import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

// Load e2e/.env file for credentials
require("dotenv").config({ path: path.resolve(__dirname, "e2e/.env") });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://admin.beautyup-enterprise.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
