import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ServiceUnavailableException } from '@nestjs/common';

import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { configValidationSchema } from '../src/config/config.validation';

test('readiness succeeds only when the database probe succeeds', async () => {
  const prisma = { $queryRaw: async () => [ { value: 1 } ] } as unknown as PrismaService;
  const result = await new HealthController(prisma).ready();
  assert.equal(result.status, 'ready');
  assert.equal(result.database, 'connected');
});

test('readiness returns 503 rather than falsely reporting a failed database as ready', async () => {
  const prisma = {
    $queryRaw: async () => { throw new Error('database password: must not be leaked'); },
  } as unknown as PrismaService;
  await assert.rejects(
    new HealthController(prisma).ready(),
    (error: unknown) =>
      error instanceof ServiceUnavailableException &&
      !JSON.stringify(error.getResponse()).includes('database password'),
  );
});

test('CORS config permits exact comma-separated staging origins', () => {
  const env = {
    DATABASE_URL: 'postgresql://example.invalid/db',
    DIRECT_URL: 'postgresql://example.invalid/db',
    SUPABASE_JWT_ISSUER: 'https://example.supabase.co/auth/v1',
    FRONTEND_ORIGIN: 'http://localhost:3000, https://usi-preview.vercel.app',
  };
  const result = configValidationSchema.validate(env, { allowUnknown: true });
  assert.equal(result.error, undefined);
  assert.equal(result.value.FRONTEND_ORIGIN, 'http://localhost:3000,https://usi-preview.vercel.app');
});

test('CORS config rejects wildcards and URL paths', () => {
  const base = {
    DATABASE_URL: 'postgresql://example.invalid/db',
    DIRECT_URL: 'postgresql://example.invalid/db',
    SUPABASE_JWT_ISSUER: 'https://example.supabase.co/auth/v1',
  };
  for (const origin of ['*', 'https://*.vercel.app', 'https://example.com/private', 'https://example.com,']) {
    const result = configValidationSchema.validate({ ...base, FRONTEND_ORIGIN: origin }, { allowUnknown: true });
    assert.ok(result.error, origin + ' should have been rejected');
  }
});
