import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('measure anonymous mobile loading with simulated 4G and 4x CPU slowdown', async ({ browser, baseURL }, testInfo) => {
  test.skip(!baseURL?.startsWith('http://localhost'), 'Controlled local lab only');
  test.setTimeout(180000);
  const samples = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    for (const path of ['/', '/learn']) {
      for (let iteration = 0; iteration < 5; iteration += 1) {
        const page = await context.newPage();
        const devtools = await context.newCDPSession(page);
        await devtools.send('Network.enable');
        await devtools.send('Network.setCacheDisabled', { cacheDisabled: true });
        await devtools.send('Network.emulateNetworkConditions', {
          offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
        });
        await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.addInitScript(() => {
          const metrics = { lcpMs: 0, cls: 0 };
          Object.assign(window, { uiiLabMetrics: metrics });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) metrics.lcpMs = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) metrics.cls += shift.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(baseURL! + path);
        await expect(page.locator('main')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000); // Fixed post-load observation window for every sample.
        const metrics = await page.evaluate(() => {
          const state = window as Window & { uiiLabMetrics?: { lcpMs: number; cls: number } };
          return state.uiiLabMetrics;
        });
        expect(metrics?.lcpMs).toBeGreaterThan(0);
        samples.push({ path, iteration, ...metrics });
        await page.close();
      }
    }
  } finally { await context.close(); }
  await writeFile(testInfo.outputPath('mobile-performance.json'), JSON.stringify({
    conditions: 'Chrome, 390x844, 150ms latency, 1.6Mbps download, 0.75Mbps upload, 4x CPU, cache disabled, anonymous local production build',
    samples,
  }, null, 2));
});
