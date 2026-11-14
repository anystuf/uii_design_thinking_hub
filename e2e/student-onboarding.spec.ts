import { test, expect } from '@playwright/test';

test('first-time student discovers a course and sees the enrollment action at 320px', async ({ page }, testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.startsWith('http://localhost'), 'Local UI fixtures only');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: 'local-fixture-token', refresh_token: 'local-fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'student', email: 'student@example.test' },
  })));
  const course = { id: 'course', title: 'Design Thinking Foundations', status: 'PUBLISHED', createdById: 'teacher', level: 'Foundation', description: 'Explore design methods.' };
  await page.route('http://localhost:4000/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'student', fullName: 'Fixture student', role: 'STUDENT' };
    if (path === '/courses') data = [course];
    if (path === '/courses/course') data = course;
    await route.fulfill({ json: data });
  });
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Bắt đầu hành trình Design Thinking' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('student-onboarding-320.png'), fullPage: true });
  await page.getByRole('link', { name: 'Khám phá khóa học', exact: true }).click();
  await page.getByLabel('Tìm khóa học').fill('unmatched');
  await expect(page.getByText('Không có khóa học phù hợp. Hãy thử từ khóa khác.')).toBeVisible();
  await page.getByLabel('Tìm khóa học').fill('Design Thinking');
  await page.getByRole('button', { name: /Design Thinking Foundations/ }).click();
  await expect(page.getByRole('button', { name: 'Ghi danh khóa học' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
