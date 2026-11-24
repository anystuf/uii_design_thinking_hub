import { expect, test } from "@playwright/test";

const journeys = [
  ["Empathize", "empathy"],
  ["Define", "framing"],
  ["Ideate", "ideation"],
  ["Prototype", "prototyping"],
  ["Test", "iteration"],
] as const;

test("homepage shows clickable infinity journey without changing demo destinations", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const section = page.locator("#how");

  await expect(section.getByTestId("uii-infinity-journey")).toBeVisible();
  await expect(section.getByText("QUY TRÌNH PHI TUYẾN TÍNH").first()).toBeVisible();
  for (const [label, query] of journeys) {
    await expect(
      section.getByRole("link", { name: new RegExp(label, "i") }).filter({ visible: true })
    ).toHaveAttribute("href", "/demo?course=" + query);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("homepage keeps all five modes usable on a narrow phone", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");
  const section = page.locator("#how");

  await expect(section.getByTestId("uii-infinity-journey")).toBeHidden();
  for (const [label, query] of journeys) {
    const link = section.getByRole("link", { name: new RegExp(label, "i") }).filter({ visible: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/demo?course=" + query);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
