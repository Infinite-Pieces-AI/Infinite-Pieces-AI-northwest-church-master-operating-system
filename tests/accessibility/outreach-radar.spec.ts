import { expect, test } from "@playwright/test";

test("Outreach radar exposes landmarks, headings, and keyboard-reachable controls", async ({ page }) => {
  await page.goto("/radar");
  await expect(page.getByRole("navigation", { name: "Outreach Intelligence navigation" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Command Radar" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
