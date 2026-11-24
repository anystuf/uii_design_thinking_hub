import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { UsersService } from '../src/modules/users/users.service';
import { PrismaService } from '../src/database/prisma/prisma.service';

test('admin directory propagates a failed read instead of reporting an empty platform', async () => {
  const failure = new Error('database unavailable');
  const prisma = { user: { findMany: async () => { throw failure; } } } as unknown as PrismaService;
  await assert.rejects(new UsersService(prisma).findAll(), failure);
});
