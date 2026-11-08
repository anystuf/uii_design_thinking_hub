import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { authenticatedApi } from '../../lib/authenticated-api';

test('client request verifies Bearer identity and preserves JSON mutations', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      assert.equal(
        new Headers(init?.headers).get('Authorization'),
        'Bearer test-token',
      );
      assert.equal(
        new Headers(init?.headers).get('Content-Type'),
        'application/json',
      );
      assert.equal(init?.method, 'PUT');
      assert.equal(init?.cache, 'no-store');
      return Response.json({ completed: true });
    };
    assert.deepEqual(
      await authenticatedApi('/lessons/test/progress', 'test-token', {
        method: 'PUT',
        body: JSON.stringify({ completed: true }),
      }),
      { completed: true },
    );
  } finally {
    globalThis.fetch = previous;
  }
});

test('client errors include safe request correlation but never raw upstream data', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response('password=private-value', {
        status: 503,
        headers: { 'X-Request-Id': 'correlation-1' },
      });
    await assert.rejects(
      authenticatedApi('/auth/me', 'test-token'),
      (error: unknown) => {
        return (
          error instanceof Error &&
          error.message.includes('503') &&
          error.message.includes('correlation-1') &&
          !error.message.includes('private-value')
        );
      },
    );
  } finally {
    globalThis.fetch = previous;
  }
});

test('client forwards cancellation to the network request', async () => {
  const previous = globalThis.fetch;
  try {
    const caller = new AbortController();
    globalThis.fetch = async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    const request = authenticatedApi('/auth/me', 'test-token', {
      signal: caller.signal,
    });
    caller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  } finally {
    globalThis.fetch = previous;
  }
});
