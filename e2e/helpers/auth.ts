import { Page } from "@playwright/test";

export async function loginAdmin(page: Page, email?: string, password?: string) {
  await page.goto("/auth/signin");
  await page.fill('input[type="email"]', email ?? process.env.ADMIN_EMAIL ?? "admin@beautyup-enterprise.com");
  await page.fill('input[type="password"]', password ?? process.env.ADMIN_PASSWORD ?? "");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 10000 });
}
