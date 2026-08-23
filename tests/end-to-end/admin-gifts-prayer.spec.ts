import { expect, test } from "@playwright/test";

test("showcase administrator can moderate a gift post", async ({ page }) => {
  await page.goto("/admin/gifts");
  await expect(
    page.getByRole("heading", { level: 1, name: "Gift marketplace moderation" }),
  ).toBeVisible();
  await expect(page.getByText("Paid electrical repair assistance")).toBeVisible();
  page.once("dialog", async (dialog) => {
    await dialog.accept("Reviewed professional claims, home-access language, and payment terms.");
  });
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByRole("status")).toContainText(/approved/i);
  await page.getByRole("button", { name: "Decision history" }).click();
  await expect(page.getByText("Paid electrical repair assistance")).toBeVisible();
});

test("showcase minister can route a restricted prayer request", async ({ page }) => {
  await page.goto("/admin/prayer");
  await expect(
    page.getByRole("heading", { level: 1, name: "Restricted prayer routing" }),
  ).toBeVisible();
  await expect(page.getByText("Private pastoral conversation requested")).toBeVisible();
  page.once("dialog", async (dialog) => {
    await dialog.accept("Assigned for a private pastoral follow-up outside the member feed.");
  });
  await page.getByRole("button", { name: "Assign to me" }).first().click();
  await expect(page.getByRole("status")).toContainText(/in review/i);
  await expect(page.getByText("Local Preview Leader")).toBeVisible();
});
