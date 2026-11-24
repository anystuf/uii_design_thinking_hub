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


test("infinity mode cards stay inside the journey without overlapping on desktop", async ({ page }, testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const section = page.locator("#how");
  const ribbon = section.getByTestId("uii-infinity-journey");
  const canvas = ribbon.locator("xpath=..");
  const links = section.locator('a[href^="/demo?course="]:visible');
  await expect(ribbon).toBeVisible();
  await expect(links).toHaveCount(5);
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();

  const bounds = [];
  for (let index = 0; index < 5; index++) {
    const link = links.nth(index);
    await expect(link).toHaveCSS("position", "absolute");
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    if (!box || !canvasBox) continue;
    expect(box.x, "card should not exit canvas left").toBeGreaterThanOrEqual(canvasBox.x - 2);
    expect(box.x + box.width, "card should not exit canvas right").toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 2);
    expect(box.y, "card should not exit canvas top").toBeGreaterThanOrEqual(canvasBox.y - 2);
    expect(box.y + box.height, "card should not exit canvas bottom").toBeLessThanOrEqual(canvasBox.y + canvasBox.height + 2);
    bounds.push(box);
  }

  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const horizontalOverlap = Math.min(bounds[i].x + bounds[i].width, bounds[j].x + bounds[j].width) - Math.max(bounds[i].x, bounds[j].x);
      const verticalOverlap = Math.min(bounds[i].y + bounds[i].height, bounds[j].y + bounds[j].height) - Math.max(bounds[i].y, bounds[j].y);
      expect(horizontalOverlap <= 2 || verticalOverlap <= 2, "mode cards must never overlap").toBe(true);
    }
  }

  const coursesBox = await page.locator("#courses").boundingBox();
  expect(coursesBox).not.toBeNull();
  if (coursesBox) expect(Math.max(...bounds.map(box => box.y + box.height))).toBeLessThan(coursesBox.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await section.screenshot({ path: testInfo.outputPath("infinity-desktop-1440.png") });
});

test("non-linear journey does not overlap or overflow at tablet and phone widths", async ({ page }, testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const section = page.locator("#how");
    const cards = section.locator('a[href^="/demo?course="]:visible');
    await expect(cards).toHaveCount(5);
    let priorBottom = -Infinity;
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (!box) continue;
      expect(box.x, "card must fit viewport").toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, "card must fit viewport").toBeLessThanOrEqual(width + 1);
      if (width < 640) {
        expect(box.y, "mobile cards must stack without overlap").toBeGreaterThanOrEqual(priorBottom - 1);
        priorBottom = box.y + box.height;
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page must not scroll sideways").toBe(true);
    if (width === 320 || width === 1024) {
      await section.screenshot({ path: testInfo.outputPath("infinity-" + width + ".png") });
    }
  }
});
