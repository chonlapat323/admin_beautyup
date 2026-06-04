import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Members", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/members");
    await page.waitForLoadState("networkidle");
  });

  test("members page loads", async ({ page }) => {
    const hasContent =
      await page.getByText("สมาชิก").isVisible().catch(() => false) ||
      await page.locator("table").isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("search input exists and accepts input", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });
});
