import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { PrismaClient, EvidenceType, SprintStageType, UserRole } from '@prisma/client';

import { EvidenceService } from '../src/modules/evidence/evidence.service';
import { SnapshotSubmissionsService } from '../src/modules/snapshot-submissions/snapshot-submissions.service';

test('Release C: persisted evidence versions and submissions are immutable snapshots', async () => {
  if (!process.env.DATABASE_URL || process.env.RUN_DB_INTEGRATION !== 'true') return;
  const prisma = new PrismaClient();
  try {
    const student = await prisma.user.findUniqueOrThrow({
      where: { id: '22222222-2222-4222-8222-222222222222' },
    });
    const current = {
      id: student.id, email: student.email, fullName: student.fullName,
      role: UserRole.STUDENT,
    };
    const projectId = '44444444-4444-4444-8444-444444444444';
    const access = { project: async () => ({ id: projectId, challengeId: null }) };
    const evidenceService = new EvidenceService(prisma as never, access as never);
    const submissionService = new SnapshotSubmissionsService(prisma as never, access as never);

    const created = await evidenceService.create(projectId, {
      mode: SprintStageType.EMPATHIZE, type: EvidenceType.INTERVIEW,
      title: 'Original interview', reflection: 'Need clearer arrival times.',
    }, current);
    assert.equal(created.version.version, 1);

    const submission1 = await submissionService.submit(projectId, {
      evidenceVersionIds: [created.version.id], note: 'First test',
    }, current);
    assert.equal(submission1.version, 1);

    const newer = await evidenceService.revise(created.evidence.id, {
      title: 'Refined interview evidence', reflection: 'Tested updated hypothesis.',
    }, current);
    assert.equal(newer.version, 2);

    const submission2 = await submissionService.submit(projectId, {
      evidenceVersionIds: [newer.id], note: 'Second test',
    }, current);
    assert.equal(submission2.version, 2);

    const old = await prisma.submissionSnapshot.findUniqueOrThrow({
      where: { id: submission1.id },
      include: { items: { include: { evidenceVersion: true } } },
    });
    assert.equal(old.items[0].evidenceVersion.title, 'Original interview');
    assert.equal(old.items[0].evidenceVersion.version, 1);

    const latest = await prisma.evidenceVersion.findMany({
      where: { evidenceId: created.evidence.id }, orderBy: { version: 'asc' },
    });
    assert.equal(latest.length, 2);
    assert.equal(latest[0].title, 'Original interview');
    assert.equal(latest[1].title, 'Refined interview evidence');

    // Each submission's item is bound to its original evidence version ID.
    assert.equal(old.items[0].evidenceVersionId, created.version.id);
    assert.notEqual(submission2.items[0].evidenceVersionId, created.version.id);
  } finally {
    await prisma.$disconnect();
  }
});
