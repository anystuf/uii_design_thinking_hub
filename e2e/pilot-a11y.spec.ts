import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Anonymous, synthetic accessibility checks for classroom launch surfaces.
// Real role-based accessibility still needs authorized staging UAT.
for (const path of ['/pilot', '/learn', '/forgot-password', '/classroom']) {
  test(`pilot accessibility and mobile layout: ${path}`, async ({ page }) => {
    test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = audit.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(blocking, blocking.map(v => v.id + ': ' + v.nodes.length + ' nodes').join('; ')).toEqual([]);
  });
}
