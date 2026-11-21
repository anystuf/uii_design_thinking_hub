import assert from 'node:assert/strict';

const api = process.env.STAGING_API_ORIGIN?.replace(/\/+$/, '');
if (!api) throw new Error('STAGING_API_ORIGIN must point to the approved staging Render API.');
const preview = process.env.STAGING_FRONTEND_ORIGIN || 'https://uii-design-thinking-hub-staging.vercel.app';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(path, options = {}) {
  return fetch(api + path, { ...options, signal: AbortSignal.timeout(30000) });
}

let ready = false;
for (let i = 0; i < 7; i++) {
  try {
    const health = await request('/health');
    const payload = await health.json();
    assert.equal(health.status, 200);
    assert.equal(payload.status, 'ok');
    const db = await request('/health/ready');
    if (db.status === 200 && (await db.json()).database === 'connected') {
      ready = true;
      break;
    }
    console.log('Database not ready, retrying', i + 1, db.status);
  } catch (err) {
    console.log('Warm-up retry', i + 1, err instanceof Error ? err.name : 'network issue');
  }
  await pause(8000);
}
assert.equal(ready, true, 'Staging API and DB must become ready');

// Deployment contract: an existing guarded endpoint returns 401 without a
// bearer token. A 404 proves the preview frontend is ahead of the Render API.
const communityQuestions = await request('/community/questions');
assert.equal(
  communityQuestions.status, 401,
  'Community Q&A API is not deployed. Expected protected GET /community/questions -> 401 (no token); 404 indicates an outdated Render commit.'
);

const unauthorized = await request('/courses/00000000-0000-4000-8000-000000000000/my-rewards');
assert.equal(unauthorized.status, 401, 'Rewards must reject unauthenticated requests');

const preflight = {
  method: 'OPTIONS',
  headers: {
    Origin: preview,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Authorization',
  },
};
const cors = await request('/auth/me', preflight);
assert.equal(cors.headers.get('access-control-allow-origin'), preview, 'Exact Preview origin must be authorized');

const foreignOrigin = 'https://untrusted-uui-example.invalid';
const disallowed = await request('/auth/me', {
  ...preflight,
  headers: { ...preflight.headers, Origin: foreignOrigin },
});
assert.notEqual(disallowed.headers.get('access-control-allow-origin'), foreignOrigin, 'Unknown origin must not be authorized');
console.log('PASS: staging readiness, Community Q&A route, JWT boundary and exact Preview CORS');
