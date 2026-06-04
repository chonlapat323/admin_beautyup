import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Products", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("navigates to products page and shows products table", async ({ page }) => {
    await page.goto("/products");

    const hasHeading = await page.getByText("สินค้า").isVisible().catch(() => false);
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    expect(hasHeading || hasTable).toBe(true);
  });

  test("search input exists on products page", async ({ page }) => {
    await page.goto("/products");

    const searchInput = page.locator('input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
  });
});
