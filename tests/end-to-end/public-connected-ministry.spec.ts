import { expect, test } from "@playwright/test";

test("public journey moves from Jesus-centered clarity to voluntary next steps", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Meet Jesus. Find your people. Serve Lowell." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I am looking for community" }).click();
  await expect(
    page.getByRole("heading", { name: "Find relationships that move beyond Sunday morning." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "What to expect" }).first().click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /What to expect before, during, and after worship/,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Can I come alone?" })).toBeVisible();
});

test("visit, question, and prayer use separate public pathways", async ({ page }) => {
  await page.goto("/plan-a-visit");
  await expect(page.getByLabel("Last name (optional)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tell someone I’m coming" })).toBeVisible();
  await page.goto("/ask-a-question");
  await expect(
    page.getByRole("heading", { level: 1, name: "Ask before you decide" }),
  ).toBeVisible();
  await page.goto("/request-prayer");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Request prayer without entering a marketing funnel/,
    }),
  ).toBeVisible();
  await expect(page.getByText(/separated from public analytics/)).toBeVisible();
});
