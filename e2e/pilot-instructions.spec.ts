import { expect, test } from "@playwright/test";

test("teacher pilot guide is readable without login at 320px and links to the right tasks", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/pilot");
  await expect(page.getByRole("heading", { level: 1, name: /One clear task/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Try the demo without an account/ })).toHaveAttribute("href", "/demo");
  await expect(page.getByRole("link", { name: /Sign in with a test account/ })).toHaveAttribute("href", "/learn");
  await expect(page.getByText(/Saving evidence does NOT mean your assignment was submitted/)).toBeVisible();
  await expect(page.getByText(/two real-world problems/i).first()).toBeVisible();
  await expect(page.getByText(/Never enter interviewee identities/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId("creative-pointer-trail")).toHaveCount(0);
});
