import assert from 'node:assert/strict';
import test from 'node:test';

import { assertUiiStagingOrigin } from './uii-staging-preflight.mjs';

test('UII staging target validation permits only explicitly approved staging hosts', () => {
  const frontend = [
    'https://uii-design-thinking-hub-staging.vercel.app',
    'https://uii-design-thinking-hub-preview.vercel.app',
    'https://uii-design-thinking-web-staging-35zt6ucrp-brian-tran-s-projects.vercel.app',
  ];
  for (const origin of frontend) assert.equal(assertUiiStagingOrigin(origin, 'frontend'), origin);
  const api = [
    'https://usi-design-thinking-api-staging.onrender.com',
    'https://uii-design-thinking-api-staging.onrender.com',
  ];
  for (const origin of api) assert.equal(assertUiiStagingOrigin(origin, 'api'), origin);
});

test('UII staging target validation rejects unrelated origins, credentials and insecure URLs', () => {
  const rejected = [
    'https://supabase.com/dashboard/project/aignaxmirbbnfuutvvdg',
    'https://other-project.vercel.app',
    'https://usi-design-thinking-web-staging.vercel.app',
    'https://uii-design-thinking-hub-staging.vercel.app.evil.test',
    'http://uii-design-thinking-hub-staging.vercel.app',
    'https://guest:secret@uii-design-thinking-hub-staging.vercel.app',
    'https://uii-design-thinking-hub-staging.vercel.app/learn',
    'https://uii-design-thinking-hub-staging.vercel.app?token=anything',
  ];
  for (const origin of rejected) assert.throws(() => assertUiiStagingOrigin(origin, 'frontend'), { name: 'AssertionError' });
  assert.throws(() => assertUiiStagingOrigin('https://other-api.onrender.com', 'api'), { name: 'AssertionError' });
  assert.throws(() => assertUiiStagingOrigin(undefined, 'frontend'), { name: 'AssertionError' });
});
