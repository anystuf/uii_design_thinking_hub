import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { EvidenceType, SprintStageType, UserRole } from '@prisma/client';

import { PrivateStorageService } from '../src/modules/evidence/private-storage.service';
import { EvidenceService } from '../src/modules/evidence/evidence.service';
import { SnapshotSubmissionsService } from '../src/modules/snapshot-submissions/snapshot-submissions.service';

const student = {
  id: 'student-a', email: 'student@example.edu',
  fullName: 'Student', role: UserRole.STUDENT,
};

test('F09: upload presign checks team access before issuing upload intent', async () => {
  const service = new PrivateStorageService({} as never, {
    uploadIntent: { create: async () => { throw new Error('Unexpected upload intent'); } },
  } as never, { project: async () => { throw new ForbiddenException('Not a team member.'); } } as never);
  await assert.rejects(
    () => service.presign('project-1', { fileName: 'data.pdf', mimeType: 'application/pdf', size: 1024 }, student),
    (error: unknown) => error instanceof ForbiddenException,
  );
});

test('F09: disallowed upload MIME does not create a storage token', async () => {
  const service = new PrivateStorageService({} as never, {} as never, {
    project: async () => ({ id: 'project-1' }),
  } as never);
  await assert.rejects(
    () => service.presign('project-1', { fileName: 'script.exe', mimeType: 'application/x-msdownload', size: 1024 }, student),
    (error: unknown) => error instanceof BadRequestException,
  );
});

test('F09: upload completion refuses a different user', async () => {
  const service = new PrivateStorageService({} as never, {
    uploadIntent: { findUnique: async () => ({ id: 'intent-1', userId: 'someone-else' }) },
  } as never, {} as never);
  await assert.rejects(() => service.complete('intent-1', student),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F11: an evidence file cannot reference another project asset', async () => {
  const service = new EvidenceService({
    sprintStage: { findUnique: async () => ({ id: 'stage-1' }) },
    fileAsset: { findUnique: async () => ({ id: 'asset-1', projectId: 'other-project' }) },
  } as never, { project: async () => ({ id: 'project-1' }) } as never);
  await assert.rejects(() => service.create('project-1', {
    mode: SprintStageType.EMPATHIZE, type: EvidenceType.DOCUMENT,
    title: 'Evidence', fileAssetId: 'asset-1',
  }, student), (error: unknown) => error instanceof BadRequestException);
});

test('F11: original author policy protects evidence revisions', async () => {
  const service = new EvidenceService({
    evidence: { findUnique: async () => ({
      id: 'evidence-1', projectId: 'project-1', createdById: 'another-student',
    }) },
  } as never, { project: async () => ({ id: 'project-1' }) } as never);
  await assert.rejects(() => service.revise('evidence-1', { title: 'Edit' }, student),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F12: milestone must belong to the same project challenge', async () => {
  const service = new SnapshotSubmissionsService({
    challengeMilestone: { findUnique: async () => ({
      id: 'milestone-1', challengeId: 'different-challenge', allowLate: true,
    }) },
  } as never, { project: async () => ({ id: 'project-1', challengeId: 'challenge-1' }) } as never);
  await assert.rejects(() => service.submit('project-1', {
    milestoneId: 'milestone-1', evidenceVersionIds: ['evidence-version-1'],
  }, student), (error: unknown) => error instanceof BadRequestException);
});

test('F12: late submission is rejected when milestone prohibits late work', async () => {
  const service = new SnapshotSubmissionsService({
    challengeMilestone: { findUnique: async () => ({
      id: 'milestone-1', challengeId: 'challenge-1',
      dueAt: new Date('2020-01-01T00:00:00Z'), allowLate: false,
    }) },
  } as never, { project: async () => ({ id: 'project-1', challengeId: 'challenge-1' }) } as never);
  await assert.rejects(() => service.submit('project-1', {
    milestoneId: 'milestone-1', evidenceVersionIds: ['evidence-version-1'],
  }, student), (error: unknown) => error instanceof ConflictException);
});

test('F12: snapshot validates project association for every evidence version', async () => {
  const service = new SnapshotSubmissionsService({
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      evidenceVersion: { findMany: async () => [
        { id: 'v1', evidence: { projectId: 'other-project' } },
      ] },
    }),
  } as never, { project: async () => ({ id: 'project-1' }) } as never);
  await assert.rejects(() => service.submit('project-1', {
    evidenceVersionIds: ['v1'],
  }, student), (error: unknown) => error instanceof BadRequestException);
});
