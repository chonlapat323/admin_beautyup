import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Orders", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("navigates to orders page and shows orders table", async ({ page }) => {
    await page.goto("/orders");

    const hasHeading = await page.getByText("คำสั่งซื้อ").isVisible().catch(() => false);
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    expect(hasHeading || hasTable).toBe(true);
  });

  test("search input accepts order number input", async ({ page }) => {
    await page.goto("/orders");

    const searchInput = page.locator('input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("ORD-001");
    await expect(searchInput).toHaveValue("ORD-001");
  });

  test("status filter button is clickable", async ({ page }) => {
    await page.goto("/orders");

    const filterButton = page.locator('button, select').filter({ hasText: /สถานะ|status|filter/i }).first();
    await expect(filterButton).toBeVisible();
    await filterButton.click();
  });
});
