import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { requestDiagnostics } from '../src/common/request-diagnostics';

test('request diagnostics use a route template and exclude secrets, queries and identities', () => {
  const entries: string[] = [];
  const res = Object.assign(new EventEmitter(), {
    statusCode: 401,
    setHeader: () => undefined,
  });
  const req = {
    method: 'GET',
    url: '/users/private-user?token=private-token',
    headers: { authorization: 'Bearer private-jwt' },
    route: { path: '/users/:id' },
  };
  let continued = false;
  requestDiagnostics((entry) => entries.push(entry))(
    req as never,
    res as never,
    () => {
      continued = true;
    },
  );
  res.emit('finish');
  res.emit('close');
  assert.ok(continued);
  assert.equal(entries.length, 1);
  const entry = JSON.parse(entries[0]);
  assert.equal(entry.route, '/users/:id');
  assert.equal(entry.status, 401);
  assert.equal(entry.event, 'finished');
  assert.ok(entry.requestId);
  assert.ok(!entries[0].includes('private-'));
});

test('a client disconnect is not reported as HTTP success', () => {
  const entries: string[] = [];
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader: () => undefined,
  });
  requestDiagnostics((entry) => entries.push(entry))(
    { method: 'GET' } as never,
    res as never,
    () => undefined,
  );
  res.emit('close');
  assert.equal(JSON.parse(entries[0]).status, null);
  assert.equal(JSON.parse(entries[0]).event, 'disconnected');
});
