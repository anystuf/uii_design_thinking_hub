import { expect, test } from "@playwright/test";

test("feedback regression: demo quizzes are course-specific, explained, and color-coded correctly", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo?course=foundations");
  await expect(page.getByText(/Students rarely use a renovated study area/)).toBeVisible();
  const foundationCorrect = page.getByRole("radio", { name: /Observe how students actually use the space/ });
  await foundationCorrect.check();
  await expect(page.getByRole("status").filter({ hasText: "Correct!" })).toBeVisible();
  await expect(foundationCorrect.locator("xpath=..")).toHaveClass(/bg-\[#e6f5ed\]/);

  await page.getByRole("button", { name: /Empathy & Research/ }).click();
  await expect(page.getByText(/Your team interviews students about academic stress/)).toBeVisible();
  await page.getByRole("radio", { name: /Record interviews and post them publicly/ }).check();
  await expect(page.getByRole("status").filter({ hasText: /Try again/ })).toContainText("Hint:");
  await page.getByRole("radio", { name: /Obtain consent, collect only needed information/ }).check();
  await expect(page.getByRole("status").filter({ hasText: "Correct!" })).toContainText("privacy");

  await page.getByRole("button", { name: /Writing unbiased notes/ }).click();
  await expect(page.getByText(/Empathy Map — observation vs assumption/)).toBeVisible();
  await page.getByRole("textbox", { name: "What the user says" }).fill("I walked across three buildings to find a study space.");
  await expect(page.getByRole("textbox", { name: "What the user says" })).toHaveValue(/three buildings/);
  await expect(page.getByText(/nothing is sent to the server/).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
