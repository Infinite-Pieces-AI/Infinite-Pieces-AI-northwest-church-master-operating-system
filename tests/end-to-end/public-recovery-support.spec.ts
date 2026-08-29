import { expect, test } from "@playwright/test";

test("public recovery-support page provides low-pressure information and voluntary next steps", async ({
  page,
}) => {
  await page.goto("/recovery-support-lowell");
  await expect(
    page.getByRole("heading", { level: 1, name: "You do not have to pursue recovery alone." }),
  ).toBeVisible();
  await expect(page.getByText(/church-based peer ministry/i)).toBeVisible();
  await expect(page.getByText(/does not diagnose, detox, prescribe/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /FindTreatment.gov/ })).toBeVisible();
  await expect(page.getByLabel("First name")).toBeVisible();
  await expect(page.getByLabel("What next step would be helpful?")).toBeVisible();
  await expect(page.getByText(/does not identify private searchers/i)).toBeVisible();
});
