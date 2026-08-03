import { expect, test } from "@playwright/test";

test("public home has a single clear heading, landmarks, and keyboard-visible actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /plan a visit/i }).first()).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});
