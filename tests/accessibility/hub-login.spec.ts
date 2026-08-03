import { expect, test } from "@playwright/test";

test("member login is mobile-usable and does not enumerate accounts", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const email = page.getByLabel(/email/i);
  await expect(email).toBeVisible();
  await email.fill("unknown@example.invalid");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByRole("status")).toContainText(/approved account exists/i);
});
