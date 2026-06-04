import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("Login", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("เข้าสู่ระบบหลังบ้าน")')).toBeVisible();
  });

  test("redirects away from login after successful login", async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    expect(url).not.toContain("/login");
  });

  test("dashboard shows admin content after login", async ({ page }) => {
    await loginAdmin(page);
    // Should see some admin navigation or content
    const hasContent =
      await page.getByText("ภาพรวม").isVisible().catch(() => false) ||
      await page.getByText("คำสั่งซื้อ").isVisible().catch(() => false) ||
      await page.getByText("สมาชิก").isVisible().catch(() => false) ||
      await page.locator("nav, sidebar, [class*='sidebar'], [class*='nav']").first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });
});
