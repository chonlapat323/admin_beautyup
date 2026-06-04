import { Page } from "@playwright/test";

export async function loginAdmin(page: Page, email?: string, password?: string) {
  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email ?? process.env.ADMIN_EMAIL ?? "");
  await page.fill('input[type="password"]', password ?? process.env.ADMIN_PASSWORD ?? "");
  await page.click('button:has-text("เข้าสู่ระบบหลังบ้าน")');
  // Wait until NOT on login page anymore
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 10000 });
}
