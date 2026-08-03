import { expect, test } from "@playwright/test";

test("visitor can review service information and submit a synthetic visit request", async ({ page }) => {
  await page.goto("/plan-a-visit");
  await expect(page.getByText(/Butler Middle School/i).first()).toBeVisible();
  await page.getByLabel(/first name/i).fill("Example");
  await page.getByLabel(/last name/i).fill("Visitor");
  await page.getByLabel(/^email/i).fill("visitor@example.invalid");
  await page.getByLabel(/party size/i).fill("2");
  await page.getByLabel(/next step/i).selectOption("plan_visit");
  await page.getByLabel(/permission/i).check();
  await page.getByRole("button", { name: /submit|plan/i }).click();
  await expect(page.getByRole("status")).toContainText(/starter|thank you/i);
});
