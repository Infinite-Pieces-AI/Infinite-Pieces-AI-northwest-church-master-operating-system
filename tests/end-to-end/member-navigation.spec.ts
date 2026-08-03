import { expect, test } from "@playwright/test";

test("demo member sees calm primary navigation and no public indexing", async ({ page }) => {
  await page.goto("/this-week");
  await expect(page.getByRole("heading", { name: /this week/i })).toBeVisible();
  for (const label of ["This Week", "Bible", "Community", "Events", "Family"]) {
    await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  }
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toMatch(/noindex/i);
});
