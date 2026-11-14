import { test, expect } from '@playwright/test';

test('lecturer edits a lesson through the update API and preserves its position', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.startsWith('http://localhost'), 'Isolated local fixtures only');
  await page.addInitScript(() => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: 'local-fixture-token', refresh_token: 'local-fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'teacher', email: 'teacher@example.test' },
  })));
  const course = { id: 'course', title: 'Fixture course', createdById: 'teacher', status: 'PUBLISHED', level: 'Foundation' };
  const lesson = { id: 'lesson', courseId: 'course', title: 'Original lesson', orderIndex: 3, content: 'Practice', contentType: 'VIDEO', videoUrl: 'https://youtu.be/ldYzbV0NDp8', publishedAt: '2026-11-14T00:00:00Z' };
  let saved: Record<string, unknown> | null = null;
  await page.route('http://localhost:4000/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'teacher', role: 'LECTURER', fullName: 'Fixture teacher' };
    if (path === '/courses') data = [course];
    if (path === '/courses/course') data = course;
    if (path === '/courses/course/lessons') data = [lesson];
    if (path === '/lessons/lesson') {
      expect(request.method()).toBe('PUT');
      saved = request.postDataJSON();
      data = { ...lesson, ...saved };
    }
    await route.fulfill({ json: data, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/learn');
  await page.getByRole('button', { name: /Fixture course/ }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa bài học', exact: true }).click();
  await page.getByLabel('Tiêu đề bài học', { exact: true }).fill('Updated lesson');
  await page.getByPlaceholder('Link video YouTube (https://...)').fill('');
  await page.getByRole('button', { name: 'Lưu bài học', exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ title: 'Updated lesson', orderIndex: 3, videoUrl: null });
});
