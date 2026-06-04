import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Products", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
  });

  test("products page loads", async ({ page }) => {
    const hasContent =
      await page.getByText("สินค้า").isVisible().catch(() => false) ||
      await page.locator("table").isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("search input exists on products page", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });
});
