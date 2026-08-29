import { expect, test } from "@playwright/test";

test("authorized showroom operator can use Recovery Outreach without individual profiling", async ({
  page,
}) => {
  await page.goto("/recovery-outreach");
  await expect(page.getByRole("heading", { level: 1, name: "Recovery Outreach" })).toBeVisible();
  await expect(
    page.getByText(/Help people find responsible support without profiling private lives/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Public needs" }).click();
  await expect(page.getByText(/Christian recovery support near Lowell/i)).toBeVisible();
  await page.getByRole("button", { name: "Policy gate" }).click();
  await expect(page.getByText("Prohibited intelligence")).toBeVisible();
  await expect(page.getByText(/Private searcher identity/)).toBeVisible();
  await expect(
    page.getByText(/Hub recovery posts, progress, attendance, or membership/),
  ).toBeVisible();
});
