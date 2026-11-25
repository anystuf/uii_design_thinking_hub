import { expect, test } from '@playwright/test';

/**
 * Old confirmation emails and bookmarks sometimes point to /login.
 * It must never be a 404 and must lead to the existing sign-in screen.
 */
test('legacy /login link reaches the canonical UII sign-in screen', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/learn(?:[?#]|$)/);
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});
