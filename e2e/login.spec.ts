import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Login", () => {
  test("redirects to dashboard after successful login", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL ?? "admin@beautyup-enterprise.com");
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD ?? "");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10000 });

    const url = page.url();
    expect(url).toMatch(/\/(dashboard)?$/);
  });

  test("dashboard shows admin content after login", async ({ page }) => {
    await loginAdmin(page);

    const hasOverview = await page.getByText("ภาพรวม").isVisible().catch(() => false);
    const hasDashboard = await page.getByText("Dashboard").isVisible().catch(() => false);
    expect(hasOverview || hasDashboard).toBe(true);
  });
});
