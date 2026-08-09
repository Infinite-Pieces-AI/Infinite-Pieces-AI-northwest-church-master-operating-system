import { expect, test } from "@playwright/test";

test("authorized demo operator opens the morning brief and intelligence controls", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /Turn public questions into respectful ministry action/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Enter Demo Outreach OS/ }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole("heading", { level: 1, name: "Morning Brief" })).toBeVisible();
  await page.getByRole("link", { name: "Site Quality" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Site Quality" })).toBeVisible();
  await page.getByRole("link", { name: "Local Presence" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Local Presence" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Google Business Profile eligibility gate" }),
  ).toBeVisible();
});
