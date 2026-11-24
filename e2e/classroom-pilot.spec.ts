import { expect, test } from '@playwright/test';
import { studentClassroomNextAction, teacherClassroomNextAction } from '../lib/classroom-next-action';

test('next action never invents student completion or feedback', () => {
  const base = { enrollmentCount: 1, teamCount: 1, activityCount: 1, completedActivities: 1, evidenceCount: 1 };
  expect(studentClassroomNextAction({ ...base }, 'team-1').stage).toBe('Đang xác minh');
  expect(studentClassroomNextAction({ ...base, submissionStatus: null }, 'team-1').href)
    .toBe('/evidence?projectId=team-1');
  expect(studentClassroomNextAction({ ...base, submissionStatus: 'SUBMITTED' }, 'team-1').title)
    .toBe('Xem bài đã nộp');
  expect(studentClassroomNextAction({ ...base, submissionStatus: 'REVISION_REQUESTED' }, 'team-1').title)
    .toContain('nộp phiên bản mới');
  expect(studentClassroomNextAction({ ...base, submissionStatus: 'APPROVED' }, 'team-1').href)
    .toBe('/studio');
  expect(teacherClassroomNextAction({ courseCount: 1, publishedChallenges: 1, publishedRubrics: 1, pendingReviews: 1 }).href)
    .toBe('/review');
});

test('classroom never renders class records to an anonymous visitor', async ({ page }) => {
  await page.goto('/classroom');
  await expect(page.getByRole('heading', { name: 'Buổi học của bạn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Đăng nhập UII' })).toHaveAttribute('href', '/learn');
  await expect(page.getByLabel('Chọn dự án')).toHaveCount(0);
  await expect(page.getByLabel('Chọn khóa học')).toHaveCount(0);
});

function sessionFixture() {
  return {
    access_token: 'fixture-token', refresh_token: 'fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'fixture', email: 'fixture@example.test' },
  };
}

test('student continues actual project → evidence → revision in one guided place', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await page.addInitScript(session => localStorage.setItem('sb-example-auth-token', JSON.stringify(session)), sessionFixture());
  let snapshotStatus: string | null = null;
  await page.route('http://localhost:4000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'fixture', role: 'STUDENT', fullName: 'Student Pilot' };
    if (path === '/courses/my-enrollments') data = [{ id: 'enroll-1', courseId: 'course-1', course: { id: 'course-1', title: 'Pilot course' } }];
    if (path === '/teams/my') data = [{ id: 'team-1', title: 'Pilot Team 1', currentStage: 'EMPATHIZE' }];
    if (path === '/projects/team-1/activities') data = [{ id: 'activity-1', status: 'COMPLETED' }];
    if (path === '/projects/team-1/versioned-evidence') data = [{ id: 'evidence-1', versions: [{ id: 'version-1' }] }];
    if (path === '/projects/team-1/snapshot-submissions') data = snapshotStatus ?
      [{ id: 'snapshot-1', status: snapshotStatus, version: 1, submittedAt: '2026-11-25T00:00:00Z' }] : [];
    await route.fulfill({ json: data });
  });
  await page.setViewportSize({ width: 320, height: 840 });
  await page.goto('/classroom');
  await expect(page.getByRole('heading', { name: 'Chọn minh chứng và nộp bài' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Thực hiện bước này' })).toHaveAttribute('href', '/evidence?projectId=team-1');
  snapshotStatus = 'REVISION_REQUESTED';
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click();
  await expect(page.getByRole('heading', { name: 'Đọc phản hồi và nộp phiên bản mới' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('lecturer is shown only verified course + published rubric + pending review', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await page.addInitScript(session => localStorage.setItem('sb-example-auth-token', JSON.stringify(session)), sessionFixture());
  await page.route('http://localhost:4000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'fixture', role: 'LECTURER', fullName: 'Pilot Teacher' };
    if (path === '/courses') data = [{ id: 'course-1', title: 'Pilot Course', status: 'PUBLISHED', createdById: 'fixture' }];
    if (path === '/assessments/queue') data = [{ id: 'submission-1' }];
    if (path === '/courses/course-1/challenges') data = [{ id: 'challenge-1', title: 'Empathy research', status: 'PUBLISHED' }];
    if (path === '/challenges/challenge-1/rubrics') data = [{ versions: [{ status: 'PUBLISHED' }] }];
    await route.fulfill({ json: data });
  });
  await page.goto('/classroom');
  await expect(page.getByRole('heading', { name: 'Đánh giá bài nộp đang chờ' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Thực hiện bước này' })).toHaveAttribute('href', '/review');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
