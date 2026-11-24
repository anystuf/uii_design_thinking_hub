/**
 * Read-only UII staging acceptance preflight. No Supabase Auth account access,
 * database writes, migrations, or student records. Never echo credentials.
 */
import assert from 'node:assert/strict';

const uiOrigin = process.env.E2E_STAGING_FRONTEND_ORIGIN?.replace(/\/+$/, '');
const apiOrigin = process.env.E2E_STAGING_API_ORIGIN?.replace(/\/+$/, '');

export function assertUiiStagingOrigin(value, kind) {
  assert.ok(value, 'Missing E2E_STAGING_' + (kind === 'frontend' ? 'FRONTEND' : 'API') + '_ORIGIN');
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', kind + ' must use HTTPS');
  assert.equal(url.username, '', kind + ' must not contain credentials');
  assert.equal(url.password, '', kind + ' must not contain credentials');
  assert.equal(url.pathname, '/', kind + ' must be an origin, without a path');
  assert.equal(url.search, '', kind + ' must not have query parameters');
  assert.equal(url.hash, '', kind + ' must not have a fragment');
  if (kind === 'frontend') {
    assert.match(url.hostname,
      /^(?:uii-design-thinking-hub-(?:preview|staging)|uii-design-thinking-web-staging-[a-z0-9-]+)\.vercel\.app$/,
      'Frontend must be a verified UII Preview or Stable Staging domain');
  } else {
    assert.ok([
      'usi-design-thinking-api-staging.onrender.com', // Legacy hostname, UII API infrastructure only.
      'uii-design-thinking-api-staging.onrender.com',
    ].includes(url.hostname), 'API must be the approved UII Render staging origin');
  }
  return url.origin;
}

async function get(path, origin) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
  return response;
}

async function verifyReady(origin) {
  for (let attempt = 0; attempt < 7; attempt++) {
    try {
      const response = await get('/health/ready', origin);
      if (response.status === 200) {
        const payload = await response.json();
        if (payload.database === 'connected') return;
      }
    } catch {
      // Render's cold-start may require additional attempts.
    }
    if (attempt !== 6) await new Promise(resolve => setTimeout(resolve, 8000));
  }
  throw new Error('UII staging API database readiness could not be verified');
}

export async function runPreflight() {
  const frontend = assertUiiStagingOrigin(uiOrigin, 'frontend');
  const api = assertUiiStagingOrigin(apiOrigin, 'api');
  await verifyReady(api);
  const [learning, questions] = await Promise.all([
    get('/learn', frontend),
    get('/community/questions', api),
  ]);
  assert.equal(learning.status, 200, 'UII staging learning route must return HTTP 200');
  assert.equal(questions.status, 401, 'UII staging Q&A must require auth (401), not missing route (404)');
  console.log('PASS: UII staging frontend route, API/DB readiness, Q&A route and anonymous auth boundary');
}

if (process.argv[1]?.endsWith('/uii-staging-preflight.mjs')) {
  runPreflight().catch(err => {
    console.error('BLOCKED: ' + (err instanceof Error ? err.message : 'UII staging preflight error'));
    process.exitCode = 1;
  });
}
