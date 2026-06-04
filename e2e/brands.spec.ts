import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Brands", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/brands");
    await page.waitForLoadState("networkidle");
  });

  test("brands page loads", async ({ page }) => {
    const hasContent =
      await page.getByText("แบรนด์").isVisible().catch(() => false) ||
      await page.locator("table").isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("add brand button exists", async ({ page }) => {
    const addButton = page.locator('button').filter({ hasText: /เพิ่มแบรนด์/ }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });
});
