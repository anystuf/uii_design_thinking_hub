import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(__dirname, '..');
const legacy = ['U', 'S', 'I'].join('');
const legacyMarker = new RegExp('\\b' + legacy + '\\b|' + legacy + '[-_]', 'i');

function inspect(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) return inspect(abs);
    if (!/\\.(tsx?|jsx?|mjs|css|yaml)$/.test(name)) return [];
    const contents = readFileSync(abs, 'utf8');
    return legacyMarker.test(contents) ? [relative(root, abs)] : [];
  });
}

test('UII identity cannot regress in active frontend, backend, or deployment source', () => {
  const paths = ['app', 'components', 'lib', 'backend/src'].flatMap(folder => inspect(join(root, folder)));
  const deploymentSource = readFileSync(join(root, 'render.yaml'), 'utf8');
  if (legacyMarker.test(deploymentSource)) paths.push('render.yaml');
  expect(paths, 'Legacy identity must not be present in active application source').toEqual([]);
});

test('guest-facing UII branding is consistent across landing and login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UII Design Thinking Hub/);
  expect(legacyMarker.test(await page.locator('body').innerText())).toBe(false);
  await page.goto('/learn');
  expect(legacyMarker.test(await page.locator('body').innerText())).toBe(false);
});
