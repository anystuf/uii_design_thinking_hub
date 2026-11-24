import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

// Anonymous screen coverage. Authenticated role journeys require separate staging UAT.
const routes = ['/', '/dashboard', '/learn', '/studio', '/evidence', '/review', '/notifications', '/admin'];
const widths = [320, 360, 375, 390, 430, 768, 1024, 1440];

for (const route of routes) {
  test(`responsive anonymous screen ${route}`, async ({ page }, testInfo) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px');
      if (route === '/learn') await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
      await expect.soft.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if ([320, 768, 1440].includes(width)) {
        await page.screenshot({ path: testInfo.outputPath(`screen-${width}.png`), fullPage: true });
      }
    }
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await writeFile(testInfo.outputPath('accessibility.json'), JSON.stringify(accessibility.violations, null, 2));
    await testInfo.attach('accessibility-findings', {
      body: JSON.stringify(accessibility.violations, null, 2),
      contentType: 'application/json',
    });
    expect(accessibility.violations).toEqual([]);
  });
}
