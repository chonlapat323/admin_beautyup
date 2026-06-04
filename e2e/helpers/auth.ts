import { Page } from "@playwright/test";

export async function loginAdmin(page: Page, email?: string, password?: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email ?? process.env.ADMIN_EMAIL ?? "");
  await page.fill('input[type="password"]', password ?? process.env.ADMIN_PASSWORD ?? "");
  await page.click('button:has-text("เข้าสู่ระบบหลังบ้าน")');
  await page.waitForURL("**/", { timeout: 10000 });
}
