import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Orders", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
  });

  test("orders page loads", async ({ page }) => {
    const hasContent =
      await page.getByText("คำสั่งซื้อ").isVisible().catch(() => false) ||
      await page.locator("table").isVisible().catch(() => false) ||
      await page.locator("tr").first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("search input exists on orders page", async ({ page }) => {
    const searchInput = page.locator('input').filter({
      has: page.locator('[placeholder]')
    }).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test("status filter buttons exist", async ({ page }) => {
    // Look for filter buttons (ทุกสถานะ, รอดำเนินการ etc.)
    const filterBtn = page.locator('button').filter({ hasText: /ทั้งหมด|สถานะ|รอ/ }).first();
    const hasFilter = await filterBtn.isVisible().catch(() => false);
    expect(hasFilter).toBe(true);
  });
});
