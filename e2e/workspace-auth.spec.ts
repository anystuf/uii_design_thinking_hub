import { expect, test } from '@playwright/test';

test('registration mismatch is explained and no signup is sent at 320px', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.setViewportSize({ width: 320, height: 844 });
  let signups = 0;
  await page.route(url => url.origin === 'https://example.supabase.co' && url.pathname === '/auth/v1/signup', async route => {
    signups += 1;
    await route.fulfill({ json: { id: 'fixture-user', email: 'student@example.test' } });
  });
  await page.goto('/learn');
  await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký' }).click();
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Fixture!password123');
  const confirm = page.getByLabel('Xác nhận mật khẩu');
  await confirm.fill('Wrong!password123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Hai mật khẩu chưa khớp.' })).toHaveText('Hai mật khẩu chưa khớp.');
  await expect(confirm).toBeFocused();
  expect(signups).toBe(0);
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(confirm).toHaveAttribute('type', 'text');
  await confirm.fill('Fixture!password123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Kiểm tra hộp thư');
  expect(signups).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Google sign-in redirects to the configured Supabase provider and returns to learning', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local OAuth fixture only');
  await page.route('https://example.supabase.co/auth/v1/authorize?**', route => route.fulfill({ body: 'OAuth fixture' }));
  await page.goto('/learn');
  const request = page.waitForRequest(url => url.url().startsWith('https://example.supabase.co/auth/v1/authorize?'));
  await page.getByRole('button', { name: 'Tiếp tục với Google' }).click();
  const params = new URL((await request).url()).searchParams;
  expect(params.get('provider')).toBe('google');
  expect(params.get('redirect_to')).toBe('http://localhost:3100/learn');
});
