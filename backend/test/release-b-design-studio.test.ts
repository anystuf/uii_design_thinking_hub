import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ActivityStatus, ChallengeStatus, CourseStatus, ProjectMemberRole,
  SprintStageType, UserRole,
} from '@prisma/client';

import { ActivitiesService } from '../src/modules/activities/activities.service';
import { ChallengesService } from '../src/modules/challenges/challenges.service';
import { StudioAccessService } from '../src/modules/studio-access/studio-access.service';
import { TeamsService } from '../src/modules/teams/teams.service';

const student = { id: 'student-a', email: 'student-a@example.edu', fullName: 'Student A', role: UserRole.STUDENT };
const lecturer = { id: 'teacher-a', email: 'teacher@example.edu', fullName: 'Teacher', role: UserRole.LECTURER };
const course = { id: 'course-a', createdById: 'teacher-b', status: CourseStatus.PUBLISHED };
const challenge = {
  id: 'challenge-a', courseId: course.id, title: 'Challenge',
  status: ChallengeStatus.PUBLISHED, course,
};
const template = {
  id: 'template-a', mode: SprintStageType.EMPATHIZE, isActive: true,
  fields: [
    { key: 'user', label: 'User', type: 'text' },
    { key: 'insight', label: 'Insight', type: 'textarea' },
  ],
};

test('F05: foreign lecturer cannot manage another course', async () => {
  const access = new StudioAccessService({
    course: { findUnique: async () => course },
  } as never);
  await assert.rejects(() => access.lecturerCourse(course.id, lecturer),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F05: unpublished challenge is invisible to an enrolled student', async () => {
  const access = new StudioAccessService({
    designChallenge: { findUnique: async () => ({ ...challenge, status: ChallengeStatus.DRAFT }) },
  } as never);
  await assert.rejects(() => access.challenge(challenge.id, student),
    (error: unknown) => error instanceof Error && error.message.includes('not published'));
});

test('F05: course challenge list verifies student enrollment', async () => {
  const service = new ChallengesService({
    course: { findUnique: async () => course },
    designChallenge: { findMany: async () => { throw Error('Unexpected data leak'); } },
  } as never, { enrolledStudent: async () => { throw new ForbiddenException('No enrollment'); } } as never);
  await assert.rejects(() => service.list(course.id, student),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F06: new challenge team provisions five stages and OWNER membership', async () => {
  let projectInput: Record<string, any> = {};
  const service = new TeamsService({
    projectMember: { findFirst: async () => null },
    project: { create: async (args: { data: Record<string, any> }) => {
      projectInput = args.data;
      return { id: 'new-project', ...args.data };
    } },
  } as never, {
    challenge: async () => challenge,
    enrolledStudent: async () => course,
  } as never);
  const project = await service.create(challenge.id, { name: 'Studio Team A' }, student);
  assert.equal(project.id, 'new-project');
  assert.equal(projectInput.challengeId, challenge.id);
  assert.equal(projectInput.members.create.role, ProjectMemberRole.OWNER);
  assert.equal(projectInput.members.create.challengeId, challenge.id);
  assert.deepEqual(projectInput.stages.create.map((s: { stage: string }) => s.stage).sort(),
    Object.values(SprintStageType).sort());
});

test('F06: student cannot create second team in same challenge', async () => {
  const service = new TeamsService({
    projectMember: { findFirst: async () => ({ id: 'existing' }) },
  } as never, {
    challenge: async () => challenge,
    enrolledStudent: async () => course,
  } as never);
  await assert.rejects(() => service.create(challenge.id, { name: 'Second team' }, student),
    (error: unknown) => error instanceof ConflictException);
});

test('F06: student cannot access another team project', async () => {
  const access = new StudioAccessService({
    project: { findUnique: async () => ({
      id: 'other-team', ownerId: 'other-user', course: { createdById: 'teacher' },
    }) },
    projectMember: { findUnique: async () => null },
  } as never);
  await assert.rejects(() => access.project('other-team', student, true),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F08: draft activity rejects unexpected JSON keys', async () => {
  const service = new ActivitiesService({
    activityTemplate: { findUnique: async () => template },
  } as never, { project: async () => ({ id: 'p-a', challengeId: challenge.id }) } as never);
  await assert.rejects(() => service.start('p-a', {
    templateId: template.id, content: { arbitraryKey: 'fake data' },
  }, student), (error: unknown) => error instanceof BadRequestException);
});

test('F08: a complete activity must include all template fields', async () => {
  const service = new ActivitiesService({
    projectActivity: { findUnique: async () => ({
      id: 'activity-a', projectId: 'p-a', content: {}, status: ActivityStatus.DRAFT, template,
    }) },
  } as never, { project: async () => ({ id: 'p-a' }) } as never);
  await assert.rejects(() => service.update('activity-a', {
    content: { user: 'Learner' }, status: ActivityStatus.COMPLETED,
  }, student), (error: unknown) => error instanceof BadRequestException);
});

test('F08: valid activity draft stores content and correct mode', async () => {
  let input: Record<string, any> = {};
  const service = new ActivitiesService({
    activityTemplate: { findUnique: async () => template },
    projectActivity: { create: async (args: { data: Record<string, any> }) => {
      input = args.data;
      return args.data;
    } },
  } as never, { project: async () => ({ id: 'p-a', challengeId: challenge.id }) } as never);
  await service.start('p-a', { templateId: template.id, content: { user: 'Learner' } }, student);
  assert.equal(input.mode, SprintStageType.EMPATHIZE);
  assert.equal(input.status, ActivityStatus.DRAFT);
  assert.equal(input.createdById, student.id);
});
