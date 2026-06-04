import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Members", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("navigates to members page and shows members table", async ({ page }) => {
    await page.goto("/members");

    const hasHeading = await page.getByText("สมาชิก").isVisible().catch(() => false);
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    expect(hasHeading || hasTable).toBe(true);
  });

  test("search input accepts member search input", async ({ page }) => {
    await page.goto("/members");

    const searchInput = page.locator('input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });
});
