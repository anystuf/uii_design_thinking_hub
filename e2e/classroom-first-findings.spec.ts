import { expect, test } from '@playwright/test';
import {
  EMPTY_FIRST_FINDINGS_PROBLEM, FIRST_FINDINGS_FIELDS,
  FIRST_FINDINGS_TITLE, buildFirstFindingsEvidence, firstFindingsComplete,
} from '../lib/first-findings';
import { groupPilotStatus } from '../lib/classroom-group-status';

test('Activity 2 preserves all source prompts and stays within backend text limits', () => {
  expect(FIRST_FINDINGS_FIELDS.map(field => field.key)).toEqual([
    'problem', 'proof', 'affectedPeople', 'currentResponse', 'resourcesInUse', 'value',
  ]);
  const complete = Object.fromEntries(
    FIRST_FINDINGS_FIELDS.map(field => [field.key, 'Evidence for ' + field.key]),
  ) as typeof EMPTY_FIRST_FINDINGS_PROBLEM;
  expect(firstFindingsComplete(complete, complete, 'Two weeks and a small budget')).toBe(true);
  expect(firstFindingsComplete({ ...complete, proof: '  ' }, complete, 'Resources')).toBe(false);
  const payload = buildFirstFindingsEvidence(complete, complete, 'Two weeks and a small budget');
  expect(payload.mode).toBe('DEFINE');
  expect(payload.type).toBe('DOCUMENT');
  expect(payload.title).toBe(FIRST_FINDINGS_TITLE);
  expect(payload.description).toContain('PROBLEM 1');
  expect(payload.reflection).toContain('PROBLEM 2');
  expect(payload.description).toContain('How do you know this problem is real? What is your source?');
  expect(payload.description.length).toBeLessThanOrEqual(3000);
  expect(payload.reflection.length).toBeLessThanOrEqual(3000);
});

test('teacher board never turns missing API state into completed', () => {
  expect(groupPilotStatus(undefined, [])).toBe('UNKNOWN');
  expect(groupPilotStatus(0, undefined)).toBe('UNKNOWN');
  expect(groupPilotStatus(0, [])).toBe('NOT_STARTED');
  expect(groupPilotStatus(1, [])).toBe('EVIDENCE');
  expect(groupPilotStatus(1, [{ status:'SUBMITTED', submittedAt:'2026-11-25T10:00:00Z', version:1 }])).toBe('SUBMITTED');
  expect(groupPilotStatus(2, [
    { status:'REVISION_REQUESTED', submittedAt:'2026-11-25T10:00:00Z', version:1 },
    { status:'APPROVED', submittedAt:'2026-11-25T11:00:00Z', version:2 },
  ])).toBe('APPROVED');
});

test('Activity 2 never exposes student form without authenticated student role', async ({ page }) => {
  await page.goto('/classroom/first-findings');
  await expect(page.getByRole('heading', { name: 'Activity 2 · First Findings' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute('href', '/learn');
  await expect(page.getByRole('button', { name: 'Save Activity 2 Evidence' })).toHaveCount(0);
});

function fakeSession() {
  return {
    access_token: 'fixture-token', refresh_token: 'fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'fixture', email: 'fixture@example.test' },
  };
}

test('student answers two problems, saves real API-shaped evidence and receives next-step link', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local UII fixture only, never write live class data');
  await page.addInitScript(session =>
    localStorage.setItem('sb-example-auth-token', JSON.stringify(session)), fakeSession());
  let stored = false;
  let writes = 0;
  await page.route('http://localhost:4000/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = [];
    if (url.pathname === '/auth/me') data = { id: 'fixture', role: 'STUDENT', fullName: 'Fixture Student' };
    if (url.pathname === '/teams/my') data = [{ id: 'team-1', title: 'Pilot Team 1' }];
    if (url.pathname === '/projects/team-1/versioned-evidence') {
      if (route.request().method() === 'POST') {
        writes++;
        const body = route.request().postDataJSON();
        expect(body.title).toBe(FIRST_FINDINGS_TITLE);
        expect(body.mode).toBe('DEFINE');
        expect(body.description).toContain('PROBLEM 1');
        expect(body.reflection).toContain('PROBLEM 2');
        stored = true;
        data = { evidence: { id: 'evidence-1' }, version: { id: 'v-1', version: 1 } };
      } else {
        data = stored ? [{ id: 'evidence-1', title: FIRST_FINDINGS_TITLE, versions: [{ id: 'v-1', version: 1 }] }] : [];
      }
    }
    await route.fulfill({ json: data });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/classroom/first-findings');
  const problemGroups = page.getByRole('group', { name: /^Problem [12]$/ });
  await expect(problemGroups).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const fields = problemGroups.nth(i).locator('textarea');
    await expect(fields).toHaveCount(6);
    for (let k = 0; k < 6; k++) await fields.nth(k).fill('Synthetic evidence without personal information ' + (i + 1) + ' ' + (k + 1));
  }
  await page.getByLabel(/What resources and constraints does your team have/).fill('Synthetic: 2 days, 3 members, small budget');
  await page.getByRole('button', { name: 'Save Activity 2 Evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Activity 2 evidence saved' })).toBeVisible();
  expect(writes).toBe(1);
  await expect(page.getByRole('link', { name: /Continue to Evidence & Submission/ }))
    .toHaveAttribute('href', '/evidence?projectId=team-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('lecturer can inspect two groups without seeing a false submission', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local API fixture only');
  await page.addInitScript(session =>
    localStorage.setItem('sb-example-auth-token', JSON.stringify(session)), fakeSession());
  await page.route('http://localhost:4000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'fixture', role: 'LECTURER', fullName: 'Lecturer' };
    if (path === '/courses') data = [{ id: 'course-1', title: 'Pilot Course', status: 'PUBLISHED', createdById: 'fixture' }];
    if (path === '/assessments/queue') data = [{ id: 'submission-1' }];
    if (path === '/courses/course-1/challenges') data = [{ id: 'challenge-1', title: 'First Findings', status: 'PUBLISHED' }];
    if (path === '/challenges/challenge-1/rubrics') data = [{ versions: [{ status: 'PUBLISHED' }] }];
    if (path === '/challenges/challenge-1/teams') data = [
      { id: 'team-1', title: 'Group A' }, { id: 'team-2', title: 'Group B' },
    ];
    if (path === '/projects/team-1/versioned-evidence') data =
      [{ title: FIRST_FINDINGS_TITLE, versions: [{ id: 'v-1' }] }];
    if (path === '/projects/team-2/versioned-evidence') data = [];
    if (path === '/projects/team-1/snapshot-submissions') data =
      [{ version: 1, status: 'REVISION_REQUESTED', submittedAt: '2026-11-25T12:00:00Z' }];
    await route.fulfill({ json: data });
  });
  await page.goto('/classroom');
  await expect(page.getByRole('heading', { name: 'Project team progress' })).toBeVisible();
  const a = page.getByRole('row').filter({ hasText: 'Group A' });
  const b = page.getByRole('row').filter({ hasText: 'Group B' });
  await expect(a).toContainText('Saved');
  await expect(a).toContainText('Revision requested');
  await expect(b).toContainText('Not saved');
  await expect(b).toContainText('Not started');
  await expect(a.getByRole('link', { name: /View evidence/ }))
    .toHaveAttribute('href', '/evidence?projectId=team-1');
});
