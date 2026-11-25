import { expect, test } from '@playwright/test';
import { passwordRecoveryRedirectUrl } from '../lib/auth-redirect';

test('expired Supabase recovery redirects to a new-email request instead of the homepage', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local browser fixture only');
  await page.goto('/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
  await expect(page).toHaveURL(/\/forgot-password\?reason=expired$/);
  await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('already been used');
  await expect(page.getByRole('button', { name: 'Send reset instructions' })).toBeVisible();
});

test('custom token-hash recovery requires an explicit user click before consuming the token', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local browser fixture only');
  let verifications = 0;
  await page.route('https://example.supabase.co/auth/v1/verify**', async route => {
    verifications++;
    const body = route.request().postDataJSON();
    expect(body.type).toBe('recovery');
    expect(body.token_hash).toBe('a'.repeat(64));
    await route.fulfill({ status: 403, json: { code: 'otp_expired', msg: 'Token has expired' } });
  });
  await page.goto('/reset-password#token_hash=' + 'a'.repeat(64) + '&type=recovery');
  await expect(page.getByRole('heading', { name: 'Confirm password recovery' })).toBeVisible();
  await expect(page).not.toHaveURL(/token_hash/);
  expect(verifications).toBe(0);
  await page.getByRole('button', { name: 'Continue to reset password' }).click();
  await expect(page.getByRole('heading', { name: 'Invalid or expired link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a new recovery email' })).toHaveAttribute('href', '/forgot-password?reason=expired');
  expect(verifications).toBe(1);
});

test('recovery email destinations stay on the maintained pilot instead of preview', () => {
  expect(passwordRecoveryRedirectUrl('https://uii-design-thinking-hub-preview.vercel.app'))
    .toBe('https://uii-dt-thanh-pilot.vercel.app/reset-password');
  expect(passwordRecoveryRedirectUrl('https://uii-design-thinking-hub-staging.vercel.app'))
    .toBe('https://uii-dt-thanh-pilot.vercel.app/reset-password');
  expect(passwordRecoveryRedirectUrl('https://uii-dt-thanh-pilot.vercel.app'))
    .toBe('https://uii-dt-thanh-pilot.vercel.app/reset-password');
  expect(passwordRecoveryRedirectUrl('http://localhost:3100'))
    .toBe('http://localhost:3100/reset-password');
});
