import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Brands", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("navigates to brands page and shows brands list", async ({ page }) => {
    await page.goto("/brands");

    const hasHeading = await page.getByText("แบรนด์").isVisible().catch(() => false);
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasList = await page.locator("ul, [role='list']").isVisible().catch(() => false);
    expect(hasHeading || hasTable || hasList).toBe(true);
  });

  test('add brand button exists', async ({ page }) => {
    await page.goto("/brands");

    const addButton = page.getByRole("button", { name: /เพิ่มแบรนด์/i });
    await expect(addButton).toBeVisible();
  });
});
