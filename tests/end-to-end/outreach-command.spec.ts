import { expect, test } from "@playwright/test";

test("authorized demo operator can navigate the standalone Outreach Intelligence OS", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Outreach Intelligence OS" })).toBeVisible();
  await page.getByRole("link", { name: /Enter Demo Outreach OS/ }).click();
  await expect(page).toHaveURL(/\/radar$/);
  await expect(page.getByRole("heading", { name: "Command Radar" })).toBeVisible();
  await page.getByRole("link", { name: "Search Intelligence" }).click();
  await expect(page.getByRole("heading", { name: "Search Intelligence" })).toBeVisible();
  await page.getByRole("link", { name: "Visitor CRM" }).click();
  await expect(page.getByRole("heading", { name: "Visitor CRM" })).toBeVisible();
});
