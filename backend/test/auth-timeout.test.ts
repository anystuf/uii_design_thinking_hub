import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { AuthTimeoutError, createBoundedAuthFetch, withAuthDeadline } from '../../lib/auth-timeout';

const authUrl = 'https://auth.example.test/auth/v1/token?grant_type=password';

test('Auth fetch aborts a stalled network request instead of waiting forever', async () => {
  let aborted = false;
  const fetcher = createBoundedAuthFetch('https://auth.example.test', 10, async (_input, init) => {
    init?.signal?.addEventListener('abort', () => { aborted = true; });
    return new Promise<Response>(() => undefined);
  });
  await assert.rejects(fetcher(authUrl), AuthTimeoutError);
  assert.ok(aborted);
});

test('Auth fetch also bounds a response body that never completes', async () => {
  const fetcher = createBoundedAuthFetch('https://auth.example.test', 10, async () => {
    return new Response(new ReadableStream({ start() { /* deliberately stalled */ } }));
  });
  await assert.rejects(fetcher(authUrl), AuthTimeoutError);
});

test('Auth fetch preserves successful SDK response, HTTP errors and caller headers', async () => {
  const fetcher = createBoundedAuthFetch('https://auth.example.test', 1000, async (_input, init) => {
    assert.equal(new Headers(init?.headers).get('apikey'), 'public-test-key');
    return Response.json({ error_code: 'invalid_credentials' }, { status: 400 });
  });
  const response = await fetcher(authUrl, { method: 'POST', headers: { apikey: 'public-test-key' } });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error_code: 'invalid_credentials' });
});

test('Evidence storage requests are not affected by the Auth timeout policy', async () => {
  const response = Response.json({ uploaded: true });
  const fetcher = createBoundedAuthFetch('https://auth.example.test', 10, async () => response);
  assert.equal(await fetcher('https://auth.example.test/storage/v1/object/evidence'), response);
});

test('SDK initialization or subscriber stall is bounded even without a network request', async () => {
  await assert.rejects(withAuthDeadline(() => new Promise(() => undefined), 10), AuthTimeoutError);
  assert.equal(await withAuthDeadline(async () => 'verified', 1000), 'verified');
});
