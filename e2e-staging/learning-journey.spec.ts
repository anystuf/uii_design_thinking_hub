import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const apiUrl = 'https://usi-design-thinking-api-staging.onrender.com';
const supabaseUrl = 'https://dpapvhvceuoegztxfuuu.supabase.co';
type Role = 'STUDENT' | 'LECTURER' | 'ADMIN';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing staging test secret ${name}. Real staging UAT cannot run.`);
  return value;
}

async function identity(role: Role) {
  const client = createClient(supabaseUrl, required('E2E_SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({
    email: required(`E2E_${role}_EMAIL`), password: required(`E2E_${role}_PASSWORD`),
  });
  if (result.error || !result.data.session) throw new Error(`Staging ${role} sign-in failed.`);
  const context = await request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${result.data.session.access_token}` },
    timeout: 75000,
  });
  const me = await call(context, 'GET', '/auth/me');
  expect(me.role).toBe(role);
  return { client, context };
}

async function call(context: APIRequestContext, method: string, path: string, data?: unknown) {
  const response = await send(context, method, path, data);
  if (!response.ok()) throw new Error(`Staging ${method} ${path.split('/').slice(0, 2).join('/')} failed with HTTP ${response.status()}.`);
  return response.json();
}

async function send(context: APIRequestContext, method: string, path: string, data?: unknown) {
  try { return await context.fetch(path, { method, data }); }
  catch { throw new Error(`Staging ${method} request failed before a response. Inspect sanitized server logs.`); }
}

for (const role of ['STUDENT', 'LECTURER', 'ADMIN'] as const) {
  test(`${role} signs in with real Supabase Auth and receives its DB role`, async ({ page }) => {
    const actor = await identity(role);
    try {
      await page.goto('/learn');
      // Wrap input failures so Playwright call logs cannot echo a secret value.
      try {
        await page.getByLabel('Email', { exact: true }).fill(required(`E2E_${role}_EMAIL`));
        await page.getByLabel('Mật khẩu', { exact: true }).fill(required(`E2E_${role}_PASSWORD`));
      } catch { throw new Error(`Could not fill staging ${role} login fields.`); }
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(page.getByText({ STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị viên' }[role], { exact: true })).toBeVisible({ timeout: 90000 });
      await page.reload();
      await expect(page.getByText({ STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị viên' }[role], { exact: true })).toBeVisible({ timeout: 90000 });
      const users = await send(actor.context, 'GET', '/users');
      expect(users.status()).toBe(role === 'ADMIN' ? 200 : 403);
      if (role === 'STUDENT') expect((await send(actor.context, 'GET', '/assessments/queue')).status()).toBe(403);
      await page.getByRole('button', { name: /Đăng xuất|Logout/ }).click();
      await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
    } finally {
      await actor.client.auth.signOut();
      await actor.context.dispose();
    }
  });
}

test('real private bytes → immutable submission → revision → assessment → notification', async () => {
  const student = await identity('STUDENT');
  const teacher = await identity('LECTURER');
  try {
    const marker = `UAT ${new Date().toISOString()}`;
    const course = await call(teacher.context, 'POST', '/courses', { title: marker, level: 'Foundation', description: 'Dedicated automated staging acceptance run.' });
    await call(teacher.context, 'PUT', `/courses/${course.id}`, { status: 'PUBLISHED' });
    const lesson = await call(teacher.context, 'POST', `/courses/${course.id}/lessons`, { title: `${marker} lesson`, content: 'Staging acceptance content', isPublished: true });
    await call(student.context, 'POST', `/courses/${course.id}/enroll`);
    await call(student.context, 'PUT', `/lessons/${lesson.id}/progress`, { completed: true });
    const progress = await call(student.context, 'GET', `/courses/${course.id}/my-progress`);
    expect(progress.completedLessons).toBe(1);
    const denied = await send(student.context, 'POST', '/courses', { title: marker, level: 'Foundation' });
    expect(denied.status()).toBe(403);
    const challenge = await call(teacher.context, 'POST', `/courses/${course.id}/challenges`, { title: marker, brief: 'Staging design challenge' });
    await call(teacher.context, 'PATCH', `/challenges/${challenge.id}`, { status: 'PUBLISHED' });
    const project = await call(student.context, 'POST', `/challenges/${challenge.id}/teams`, { name: `${marker} team` });
    const bytes = new TextEncoder().encode(`UII staging upload verification ${marker}`);
    const upload = await call(student.context, 'POST', `/projects/${project.id}/uploads/presign`, { fileName: 'uat-evidence.txt', mimeType: 'text/plain', size: bytes.byteLength });
    const stored = await student.client.storage.from(upload.bucket).uploadToSignedUrl(upload.storageKey, upload.token, bytes, { contentType: 'text/plain' });
    if (stored.error) throw new Error('Real signed storage upload failed.');
    const file = await call(student.context, 'POST', `/uploads/${upload.intentId}/complete`);
    const download = await call(student.context, 'GET', `/file-assets/${file.id}/download`);
    const downloaded = await fetch(download.signedUrl);
    expect(downloaded.status).toBe(200);
    expect(Buffer.from(await downloaded.arrayBuffer()).equals(Buffer.from(bytes))).toBe(true);
    const publicObject = await fetch(`${supabaseUrl}/storage/v1/object/public/${upload.bucket}/${upload.storageKey}`);
    expect(publicObject.ok).toBe(false);
    const evidence = await call(student.context, 'POST', `/projects/${project.id}/versioned-evidence`, { mode: 'EMPATHIZE', type: 'DOCUMENT', title: `${marker} evidence`, fileAssetId: file.id });
    const originalVersion = evidence.version.id;
    const submission = await call(student.context, 'POST', `/projects/${project.id}/snapshot-submissions`, { evidenceVersionIds: [originalVersion] });
    await call(student.context, 'PATCH', `/versioned-evidence/${evidence.evidence.id}`, { title: `${marker} revised evidence` });
    const frozen = await call(teacher.context, 'GET', `/snapshot-submissions/${submission.id}`);
    expect(frozen.items[0].evidenceVersion.id).toBe(originalVersion);
    expect(frozen.items[0].evidenceVersion.title).toBe(`${marker} evidence`);
    const rubric = await call(teacher.context, 'POST', `/challenges/${challenge.id}/rubrics`, { title: `${marker} rubric` });
    const rubricId = rubric.versions[0].id;
    await call(teacher.context, 'PUT', `/rubric-versions/${rubricId}/criteria`, { criteria: [{ title: 'Evidence quality', weight: 100, maxScore: 4 }] });
    await call(teacher.context, 'POST', `/rubric-versions/${rubricId}/publish`);
    expect((await send(teacher.context, 'PUT', `/rubric-versions/${rubricId}/criteria`, { criteria: [{ title: 'Changed', weight: 100, maxScore: 4 }] })).status()).toBe(409);
    const rubricDetail = await call(teacher.context, 'GET', `/rubrics/${rubric.id}`);
    const criterion = rubricDetail.versions.find((version: { id: string }) => version.id === rubricId).criteria[0];
    await call(teacher.context, 'POST', `/snapshot-submissions/${submission.id}/assessment`, { rubricVersionId: rubricId, decision: 'REVISION_REQUESTED', feedback: 'Add a specific observation and explain the next design decision.', scores: [{ criterionId: criterion.id, score: 2 }] });
    const history = await call(student.context, 'GET', `/projects/${project.id}/snapshot-submissions`);
    expect(history.find((entry: { id: string }) => entry.id === submission.id).assessments[0].totalScore).toBe(50);
    const revised = await call(student.context, 'GET', `/projects/${project.id}/versioned-evidence`);
    const resubmission = await call(student.context, 'POST', `/projects/${project.id}/snapshot-submissions`, { evidenceVersionIds: [revised[0].versions[0].id] });
    expect(resubmission.version).toBe(submission.version + 1);
    await call(teacher.context, 'POST', `/snapshot-submissions/${resubmission.id}/assessment`, { rubricVersionId: rubricId, decision: 'APPROVED', feedback: 'Staging acceptance verification complete.', scores: [{ criterionId: criterion.id, score: 4 }] });
    const notices = await call(student.context, 'GET', '/notifications');
    expect(notices.some((notice: { entityId: string }) => notice.entityId === resubmission.id)).toBe(true);
  } finally {
    await student.client.auth.signOut(); await student.context.dispose();
    await teacher.client.auth.signOut(); await teacher.context.dispose();
  }
});
