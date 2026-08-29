import { expect, test } from "@playwright/test";

test("member can explore Gifts of the Church, Prayer Well, and Recovery Ministry showroom", async ({
  page,
}) => {
  await page.goto("/gifts");
  await expect(
    page.getByRole("heading", { level: 1, name: "Use what God has given you" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Gift board" })).toBeVisible();
  await page.getByRole("button", { name: "Create post" }).click();
  await page.getByLabel("Title").fill("I can help prepare event materials");
  await page
    .getByLabel("Description")
    .fill(
      "I can help an approved ministry prepare printed materials and organize supplies for an upcoming event.",
    );
  await page.getByRole("button", { name: /Publish to approved members/i }).click();
  await expect(page.getByRole("status")).toContainText(/post/i);

  await page.goto("/prayer");
  await expect(
    page.getByRole("heading", { level: 1, name: "Carry one another in prayer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add request" }).click();
  await page.getByLabel("Short title").fill("Wisdom for the week");
  await page
    .getByLabel("Prayer request")
    .fill("Please pray for wisdom, humility, and patience this week.");
  await page.getByRole("button", { name: "Add to Prayer Well" }).click();
  await expect(page.getByRole("status")).toContainText(/prayer request/i);

  await page.goto("/recovery");
  await expect(page.getByRole("heading", { level: 1, name: /Recovery Ministry/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Weekly journey" })).toBeVisible();
  await page.getByRole("button", { name: "Weekly journey" }).click();
  await expect(page.getByText("Weekly recovery ministry path")).toBeVisible();
});

test("mobile More destination exposes the expanded ministry routes", async ({ page }) => {
  await page.goto("/more");
  await expect(page.getByRole("heading", { level: 1, name: "More" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Gifts of the Church/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Prayer Well/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Recovery Ministry/ })).toBeVisible();
});
