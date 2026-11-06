#!/usr/bin/env node
// Safe no-credential staging probe. Does not mutate application data.
const api = process.env.USI_API_URL;
const web = process.env.USI_WEB_URL;
if (!api || !web) {
  console.error('Set USI_API_URL and USI_WEB_URL to the actual staging origins.');
  process.exit(2);
}
function asBaseUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' && u.hostname !== 'localhost') {
    throw new Error('Staging URLs must use HTTPS (localhost is permitted).');
  }
  if (u.username || u.password || u.search || u.hash) {
    throw new Error('Only a clean origin is permitted; never put credentials in URLs.');
  }
  return u.origin;
}
const apiUrl = asBaseUrl(api);
const webUrl = asBaseUrl(web);
let failures = 0;
async function probe(origin, path, expected, validate) {
  try {
    const response = await fetch(origin + path, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    let pass = response.status === expected;
    if (pass && validate) {
      const data = await response.json();
      pass = validate(data);
    }
    console.log((pass ? 'PASS ' : 'FAIL ') + path + ' => HTTP ' + response.status);
    if (!pass) failures += 1;
  } catch (error) {
    failures += 1;
    console.error('FAIL ' + path + ': ' + (error instanceof Error ? error.message : 'request failed'));
  }
}
await probe(apiUrl, '/health', 200, (d) => d?.status === 'ok');
await probe(apiUrl, '/auth/me', 401);
for (const path of ['/learn', '/studio', '/evidence', '/review', '/notifications']) {
  await probe(webUrl, path, 200);
}
console.log(failures ? 'STAGING SMOKE FAILED: ' + failures + ' check(s).' : 'STAGING SMOKE PASSED: 7 checks.');
process.exitCode = failures ? 1 : 0;
