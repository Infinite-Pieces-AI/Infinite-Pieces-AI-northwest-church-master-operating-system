import { expect, test } from "@playwright/test";

test("member can discover service and update the voluntary connection path", async ({ page }) => {
  await page.goto("/service");
  await expect(page.getByRole("heading", { level: 1, name: "Service Marketplace" })).toBeVisible();
  await page.getByRole("button", { name: "Join this shift" }).first().click();
  await expect(page.getByText(/You joined the shift/)).toBeVisible();
  await page.goto("/connection-path");
  await expect(page.getByRole("heading", { level: 1, name: "My Connection Path" })).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).first().click();
  await expect(page.getByText(/Step marked complete/)).toBeVisible();
});

test("joined member can open a purpose-specific meetup thread", async ({ page }) => {
  await page.goto("/fellowship");
  await expect(page.getByRole("heading", { level: 1, name: "Fellowship" })).toBeVisible();
  const threadLink = page.getByRole("link", { name: "Open meetup thread" }).first();
  await expect(threadLink).toBeVisible();
  await threadLink.click();
  await expect(page.getByRole("heading", { name: "Meetup thread" })).toBeVisible();
  await expect(page.getByText("Participants only")).toBeVisible();
});
